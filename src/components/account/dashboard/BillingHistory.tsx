"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { api, download, type Transaction } from "@/lib/account/client";
import { REFUND_DAYS, SUPPORT_EMAIL } from "@/lib/plans";
import { Alert, btn, btnPrimary, card, fmtDate, fmtMoney, useAction } from "./ui";

const STATUS: Record<Transaction["kind"], { label: string; cls: string }> = {
  payment: { label: "Paid", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  refund: { label: "Refunded", cls: "bg-chip text-muted" },
  failed: { label: "Failed", cls: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

/** Payments and refunds with invoice downloads; shown on the subscription page and the transactions page. */
export function BillingHistory() {
  const { busy, error, run } = useAction();
  const [tx, setTx] = useState<Transaction[] | null>(null);
  const [txError, setTxError] = useState(false);
  const [asking, setAsking] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const load = useCallback(() => api<{ transactions: Transaction[] }>("GET", "/billing/transactions").then((r) => (setTx(r.transactions), setTxError(false))).catch(() => (setTx([]), setTxError(true))), []);
  useEffect(() => {
    void load();
  }, [load]);

  const requestRefund = (id: string) =>
    run(`refund:${id}`, async () => {
      await api("POST", "/billing/refund-request", { paymentId: id, reason });
      setAsking(null);
      setReason("");
      setSent(`Refund requested. We emailed a confirmation and will reply within a few business days at the address on your account.`);
      await load();
    });

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}
      {sent && <Alert tone="ok">{sent}</Alert>}
      <section className={card} aria-labelledby="bill-tx">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="bill-tx" className="text-lg font-semibold">Billing history</h2>
        </div>
        {tx === null ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : txError ? (
          <p className="text-sm text-muted">Couldn&apos;t load your transactions right now. Please refresh in a moment.</p>
        ) : tx.length === 0 ? (
          <p className="text-sm text-muted">No purchases yet. Payments and refunds appear here as soon as they&apos;re confirmed.</p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Date</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Purchase</th>
                  <th scope="col" className="py-2 pr-3 text-right font-semibold">Amount</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Status</th>
                  <th scope="col" className="py-2 text-right font-semibold"><span className="sr-only">Invoice</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tx.map((t) => (
                  <Fragment key={`${t.kind}:${t.id}`}>
                  <tr>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-muted">{fmtDate(t.date)}</td>
                    <td className="py-2.5 pr-3">
                      <span className="font-medium">{t.description}</span>
                      <span className="block font-mono text-[11px] text-muted">{t.id}</span>
                    </td>
                    <td className={`py-2.5 pr-3 text-right whitespace-nowrap tabular-nums ${t.kind === "refund" ? "text-muted" : ""}`}>{t.kind === "refund" ? "−" : ""}{fmtMoney(t.amount, t.currency)}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS[t.kind].cls}`}>{STATUS[t.kind].label}</span>
                      {t.refundState === "pending" && <span className="mt-1 block text-[11px] text-muted">Refund requested</span>}
                      {t.refundState === "declined" && <span className="mt-1 block text-[11px] text-muted">Refund declined</span>}
                      {t.refundState === "refunded" && t.kind === "payment" && <span className="mt-1 block text-[11px] text-muted">Refunded</span>}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {t.kind === "payment" && (
                        <span className="inline-flex gap-2">
                          {t.refundable && <button type="button" className={btn} disabled={!!busy} onClick={() => { setAsking(asking === t.id ? null : t.id); setSent(null); }}>Request refund</button>}
                          <button type="button" className={btn} disabled={busy === t.id} onClick={() => run(t.id, () => download("/billing/invoice", { paymentId: t.id }, `coderef-invoice-${t.id}.pdf`))}>
                            {busy === t.id ? "Preparing…" : "Invoice"}
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {asking === t.id && (
                    <tr>
                      <td colSpan={5} className="pb-3">
                        <div className="rounded-xl border border-border bg-chip/40 p-3">
                          <p className="text-sm">Refunds are available within {REFUND_DAYS} days of payment. Tell us why (optional) and we&apos;ll email <span className="font-medium">{SUPPORT_EMAIL}</span> for you.</p>
                          <textarea className="mt-2 w-full rounded-lg border border-border bg-surface p-2 text-sm" rows={2} maxLength={1000} placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
                          <div className="mt-2 flex gap-2">
                            <button type="button" className={btn} disabled={!!busy} onClick={() => setAsking(null)}>Cancel</button>
                            <button type="button" className={btnPrimary} disabled={!!busy} onClick={() => requestRefund(t.id)}>{busy === `refund:${t.id}` ? "Sending…" : "Send request"}</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          Amounts include any tax charged. Invoices download as PDF. Refunds within {REFUND_DAYS} days: use Request refund, or email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </>
  );
}
