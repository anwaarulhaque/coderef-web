// Refund requests. A customer asks from their billing history; support@coderef.xyz is emailed (reply-to the customer),
// the customer gets a confirmation, and the request is listed in the admin panel. Refunds themselves are issued in the
// Dodo dashboard: its refund.succeeded webhook marks the request refunded (see markRefunded), and staff can decline.
import { sendPlainEmail } from "./email.ts";
import { db, rateLimit, type User } from "./db.ts";
import { HttpError, str } from "./http.ts";
import { listTransactions, type Transaction } from "./transactions.ts";
import { REFUND_DAYS, SUPPORT_EMAIL } from "../lib/plans.ts";

export type RefundState = "pending" | "refunded" | "declined" | null;
export type TransactionWithRefund = Transaction & { refundable: boolean; refundState: RefundState };

const DAY = 86_400_000;

/** Each payment with whether it can still be refunded, and where a request for it stands. */
export async function transactionsWithRefunds(user: User): Promise<TransactionWithRefund[]> {
  const tx = await listTransactions(user);
  const requests = (await db()`select payment_id, status from refund_requests where user_id = ${user.id}`) as { payment_id: string; status: RefundState }[];
  const state = new Map(requests.map((r) => [r.payment_id, r.status]));
  const refunded = new Set(tx.filter((t) => t.kind === "refund").map((t) => t.id));
  return tx.map((t) => {
    const refundState = (t.kind === "payment" ? state.get(t.id) : null) ?? (t.kind === "payment" && refunded.has(t.id) ? "refunded" : null);
    const recent = Date.now() - new Date(t.date).getTime() <= REFUND_DAYS * DAY;
    return { ...t, refundState, refundable: t.kind === "payment" && recent && !refundState };
  });
}

export async function requestRefund(user: User, paymentId: unknown, reason: unknown): Promise<void> {
  if (typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]{6,60}$/.test(paymentId)) throw new HttpError(400, "Unknown payment", "invalid_payment");
  if (!(await rateLimit(`refund:${user.id}`, 5))) throw new HttpError(429, "Too many refund requests. Email us instead.", "rate_limited");
  const payment = (await transactionsWithRefunds(user)).find((t) => t.id === paymentId && t.kind === "payment");
  if (!payment) throw new HttpError(404, "Payment not found", "not_found");
  if (payment.refundState) throw new HttpError(409, "A refund was already requested for this payment", "already_requested");
  if (!payment.refundable) throw new HttpError(409, `Refunds are available within ${REFUND_DAYS} days of payment. Email ${SUPPORT_EMAIL} and we'll take a look.`, "outside_window");

  const note = str(reason, 1000) ?? "";
  const [row] = await db()`insert into refund_requests (user_id, email, payment_id, reason) values (${user.id}, ${user.email}, ${paymentId}, ${note}) on conflict (payment_id) do nothing returning id`;
  if (!row) throw new HttpError(409, "A refund was already requested for this payment", "already_requested");

  // Emails are best effort: the request is saved either way and shows in the admin panel.
  const what = `${payment.description} (${payment.id})`;
  const send = (p: Parameters<typeof sendPlainEmail>[0]) => sendPlainEmail(p).catch((e) => console.error("refund email failed", p.to, e));
  await Promise.all([
    send({ to: SUPPORT_EMAIL, replyTo: user.email, subject: `Refund request: ${user.email}`, text: `${user.email} asked for a refund.\n\nPayment: ${what}\nPaid: ${payment.date}\nReason: ${note || "(none given)"}\n\nIssue the refund in the Dodo dashboard, then it shows as refunded in the admin panel (Refunds). Reply to this email to answer the customer.\n` }),
    send({ to: user.email, replyTo: SUPPORT_EMAIL, subject: "We got your CodeRef refund request", text: `Thanks. We received your refund request for ${what}.\n\nWe'll reply within a few business days. If approved, the refund goes back to your original payment method, usually within 5-10 business days.\n\nQuestions? Reply to this email or write to ${SUPPORT_EMAIL}.\n\n— CodeRef\n` }),
  ]);
}

/** Called when Dodo reports a refund: the matching request (if any) is done. */
export async function markRefunded(paymentId: string): Promise<void> {
  await db()`update refund_requests set status = 'refunded', resolved_at = now(), resolved_by = 'dodo' where payment_id = ${paymentId} and status = 'pending'`;
}

// ---- admin ----

export const listRefundRequests = async () =>
  (await db()`select id, email, payment_id, reason, status, created_at, resolved_at, resolved_by from refund_requests order by status = 'pending' desc, created_at desc limit 200`).map((r) => ({
    id: r.id, email: r.email, paymentId: r.payment_id, reason: r.reason, status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at, resolvedBy: r.resolved_by,
  }));

export async function resolveRefundRequest(id: string, status: unknown, adminEmail: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Request not found", "not_found");
  if (status !== "refunded" && status !== "declined") throw new HttpError(400, "Status must be refunded or declined", "invalid_status");
  const [r] = await db()`update refund_requests set status = ${status}, resolved_at = now(), resolved_by = ${adminEmail} where id = ${id} and status = 'pending' returning email, payment_id`;
  if (!r) throw new HttpError(409, "That request was already resolved", "already_resolved");
  if (status === "declined") {
    await sendPlainEmail({ to: r.email as string, replyTo: SUPPORT_EMAIL, subject: "About your CodeRef refund request", text: `We reviewed your refund request for payment ${r.payment_id} and couldn't approve it.\n\nIf you think that's a mistake, reply to this email or write to ${SUPPORT_EMAIL} and we'll take another look.\n\n— CodeRef\n` }).catch((e) => console.error("refund email failed", e));
  }
}
