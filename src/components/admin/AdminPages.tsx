"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, btn, btnPrimary, card, fmtDate } from "@/components/account/dashboard/ui";
import { api } from "@/lib/account/client";
import { input } from "./AdminLogin";
import { useAdmin } from "./AdminShell";

type Customer = { id: string; email: string; createdAt: string; lastLoginAt: string | null; pro: boolean; lifetime: boolean; plan: string | null; subscriptionStatus: string | null; subscriptionId: string | null; proUntil: string | null; dodoCustomerId: string | null };

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted";
const td = "px-3 py-2 text-sm";
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full min-w-[40rem]">
        <thead className="border-b border-border">
          <tr>{head.map((h) => <th key={h} className={th}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

function Pager({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="mt-3 flex items-center justify-between text-sm text-muted">
      <span>{total} total</span>
      <span className="flex items-center gap-2">
        <button className={btn} disabled={page === 0} onClick={() => onPage(page - 1)}>Previous</button>
        Page {page + 1} of {pages}
        <button className={btn} disabled={page + 1 >= pages} onClick={() => onPage(page + 1)}>Next</button>
      </span>
    </div>
  );
}

/** Loads a list endpoint; reloads when the query string changes. */
function useList<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(() => api<T>("GET", path).then((d) => { setData(d); setError(""); }).catch((e) => setError(msg(e))), [path]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, reload: load };
}

const Status = ({ c }: { c: Customer }) =>
  c.lifetime ? <span className="font-medium text-accent">Lifetime</span> : c.subscriptionStatus ? <span className="capitalize">{c.subscriptionStatus.replace("_", " ")}</span> : <span className="text-muted">Free</span>;

export function CustomersPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(0);
  const { data, error } = useList<{ customers: Customer[]; total: number; pro: number; pageSize: number }>(`/admin/customers?q=${encodeURIComponent(term)}&page=${page}`);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Customers</h2>
          {data && <p className="text-sm text-muted">{data.total} customers · {data.pro} with Pro access</p>}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(0); setTerm(q.trim()); }}>
          <input className={`${input} w-64`} placeholder="Search by email" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className={btn}>Search</button>
        </form>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {data && (
        <>
          <Table head={["Email", "Plan", "Status", "Pro until", "Joined", "Last sign-in"]}>
            {data.customers.map((c) => (
              <tr key={c.id}>
                <td className={`${td} font-medium`}>{c.email}</td>
                <td className={`${td} capitalize`}>{c.plan ?? "—"}</td>
                <td className={td}><Status c={c} /></td>
                <td className={td}>{c.lifetime ? "Never" : fmtDate(c.proUntil) || "—"}</td>
                <td className={td}>{fmtDate(c.createdAt)}</td>
                <td className={td}>{fmtDate(c.lastLoginAt) || "—"}</td>
              </tr>
            ))}
            {!data.customers.length && <tr><td className={`${td} text-muted`} colSpan={6}>No customers found.</td></tr>}
          </Table>
          <Pager page={page} total={data.total} size={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export function SubscriptionsPage() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const { data, error } = useList<{ subscriptions: Customer[]; total: number; pageSize: number; summary: { status: string; n: number }[] }>(`/admin/subscriptions?status=${status}&page=${page}`);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Subscriptions</h2>
      {data && (
        <div className="flex flex-wrap gap-2">
          <button className={status === "" ? btnPrimary : btn} onClick={() => { setStatus(""); setPage(0); }}>All</button>
          {data.summary.map((s) => (
            <button key={s.status} className={status === s.status ? btnPrimary : btn} onClick={() => { setStatus(s.status); setPage(0); }}>
              <span className="capitalize">{s.status.replace("_", " ")}</span> · {s.n}
            </button>
          ))}
        </div>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      {data && (
        <>
          <Table head={["Customer", "Plan", "Status", "Access until", "Subscription id"]}>
            {data.subscriptions.map((c) => (
              <tr key={c.id}>
                <td className={`${td} font-medium`}>{c.email}</td>
                <td className={`${td} capitalize`}>{c.plan ?? "—"}</td>
                <td className={td}><Status c={c} /></td>
                <td className={td}>{c.lifetime ? "Never" : fmtDate(c.proUntil) || "—"}</td>
                <td className={`${td} font-mono text-xs text-muted`}>{c.subscriptionId ?? "—"}</td>
              </tr>
            ))}
            {!data.subscriptions.length && <tr><td className={`${td} text-muted`} colSpan={5}>No subscriptions yet.</td></tr>}
          </Table>
          <Pager page={page} total={data.total} size={data.pageSize} onPage={setPage} />
        </>
      )}
    </div>
  );
}

type PlanRow = { id: string; name: string; price: string; period: string; productId: string; source: string; inDodo: boolean | null; dodoName: string | null; activeCustomers: number };

export function PlansPage() {
  const admin = useAdmin();
  const { data, error, reload } = useList<{ mode: string; dodoConfigured: boolean; plans: PlanRow[] }>("/admin/plans");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const isSuper = admin.role === "superadmin";

  async function run(fn: () => Promise<string>) {
    setBusy(true);
    setNote(null);
    try {
      setNote({ tone: "ok", text: await fn() });
    } catch (e) {
      setNote({ tone: "error", text: msg(e) });
    }
    setBusy(false);
    void reload();
  }

  const sync = () => run(async () => {
    const r = await api<{ created: string[]; synced: string[] }>("POST", "/admin/plans/sync", {});
    return r.created.length ? `Created in Dodo: ${r.created.join(", ")}.` : "Every plan already exists in Dodo and is synced to the database.";
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Plans</h2>
          {data && <p className="text-sm text-muted">Dodo Payments · <span className="font-medium uppercase">{data.mode}</span> mode</p>}
        </div>
        {isSuper && <button className={btnPrimary} disabled={busy} onClick={sync}>{busy ? "Working…" : "Create missing products in Dodo"}</button>}
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {note && <Alert tone={note.tone}>{note.text}</Alert>}
      {data && !data.dodoConfigured && <Alert tone="warn">DODO_PAYMENT_KEY is not set on the server, so Dodo can&apos;t be reached.</Alert>}
      <div className="grid gap-4 md:grid-cols-3">
        {data?.plans.map((p) => (
          <div key={p.id} className={card}>
            <div className="flex items-baseline justify-between">
              <h3 className="font-semibold">{p.name}</h3>
              <span className="text-sm text-muted">{p.price} {p.period}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{p.activeCustomers} active {p.activeCustomers === 1 ? "customer" : "customers"}</p>
            <p className="mt-3 break-all font-mono text-xs">{p.productId || "No product yet"}</p>
            <p className="mt-1 text-xs">
              {!p.productId ? <span className="text-amber-600">Not set up</span> : p.inDodo === null ? <span className="text-muted">Not checked</span> : p.inDodo ? <span className="text-emerald-600">In Dodo{p.dodoName ? `: ${p.dodoName}` : ""}</span> : <span className="text-red-600">Not found in Dodo</span>}
              {p.productId && <span className="text-muted"> · saved in {p.source}</span>}
            </p>
            {isSuper && (
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); const id = (edit[p.id] ?? "").trim(); if (id) void run(async () => { await api("PUT", `/admin/plans/${p.id}`, { productId: id }); setEdit({ ...edit, [p.id]: "" }); return `${p.name} now uses ${id}.`; }); }}>
                <input className={input} placeholder="Use another product (pdt_…)" value={edit[p.id] ?? ""} onChange={(e) => setEdit({ ...edit, [p.id]: e.target.value })} />
                <button className={btn} disabled={busy}>Set</button>
              </form>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-muted">Product ids are stored in the database, so the site and checkout pick up changes within a minute with no redeploy. Prices come from the plan list in code.</p>
    </div>
  );
}

type Employee = { id: string; email: string; name: string; role: string; active: boolean; created_at: string; last_login_at: string | null };

export function EmployeesPage() {
  const admin = useAdmin();
  const { data, error, reload } = useList<{ employees: Employee[] }>("/admin/employees");
  const [form, setForm] = useState({ name: "", email: "" });
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  if (admin.role !== "superadmin") return <Alert tone="warn">Only the superadmin can manage employees.</Alert>;

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setNote(null);
    try {
      await fn();
      setNote({ tone: "ok", text: ok });
      await reload();
    } catch (e) {
      setNote({ tone: "error", text: msg(e) });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Employees</h2>
      <form
        className={`${card} grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end`}
        onSubmit={(e) => { e.preventDefault(); void act(async () => { await api("POST", "/admin/employees", form); setForm({ name: "", email: "" }); }, "Employee added. They can sign in at /admin/login with an emailed code."); }}
      >
        <label className="text-sm"><span className="mb-1 block text-muted">Name</span><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm"><span className="mb-1 block text-muted">Email</span><input className={input} type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <button className={btnPrimary}>Add employee</button>
      </form>
      {error && <Alert tone="error">{error}</Alert>}
      {note && <Alert tone={note.tone}>{note.text}</Alert>}
      {data && (
        <Table head={["Name", "Email", "Role", "Status", "Last sign-in", ""]}>
          {data.employees.map((m) => (
            <tr key={m.id}>
              <td className={td}>{m.name || "—"}</td>
              <td className={`${td} font-medium`}>{m.email}</td>
              <td className={`${td} capitalize`}>{m.role}</td>
              <td className={td}>{m.active ? "Active" : <span className="text-red-600">Disabled</span>}</td>
              <td className={td}>{fmtDate(m.last_login_at) || "—"}</td>
              <td className={`${td} whitespace-nowrap text-right`}>
                {m.role !== "superadmin" && (
                  <span className="flex justify-end gap-2">
                    <button className={btn} onClick={() => void act(() => api("PUT", `/admin/employees/${m.id}`, { active: !m.active }), m.active ? "Employee disabled and signed out." : "Employee enabled.")}>{m.active ? "Disable" : "Enable"}</button>
                    <button className={btn} onClick={() => { if (window.confirm(`Delete ${m.email}?`)) void act(() => api("DELETE", `/admin/employees/${m.id}`), "Employee deleted."); }}>Delete</button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

type RefundRequest = { id: string; email: string; paymentId: string; reason: string; status: "pending" | "refunded" | "declined"; createdAt: string; resolvedAt: string | null; resolvedBy: string | null };

export function RefundsPage() {
  const { data, error, reload } = useList<{ requests: RefundRequest[] }>("/admin/refunds");
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const resolve = async (id: string, status: "refunded" | "declined") => {
    setNote(null);
    try {
      await api("PUT", `/admin/refunds/${id}`, { status });
      setNote({ tone: "ok", text: status === "declined" ? "Declined. The customer was emailed." : "Marked refunded." });
      await reload();
    } catch (e) {
      setNote({ tone: "error", text: msg(e) });
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Refund requests</h2>
        <p className="text-sm text-muted">Customers also email support@coderef.xyz. Issue the refund in the Dodo dashboard; it is marked refunded here automatically. Declining emails the customer.</p>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
      {note && <Alert tone={note.tone}>{note.text}</Alert>}
      {data && (
        <Table head={["Customer", "Payment", "Reason", "Requested", "Status", ""]}>
          {data.requests.map((r) => (
            <tr key={r.id}>
              <td className={`${td} font-medium`}>{r.email}</td>
              <td className={`${td} font-mono text-xs`}>{r.paymentId}</td>
              <td className={`${td} max-w-xs break-words text-muted`}>{r.reason || "—"}</td>
              <td className={td}>{fmtDate(r.createdAt)}</td>
              <td className={`${td} capitalize`}>{r.status}{r.resolvedBy && <span className="block text-xs text-muted">{r.resolvedBy}</span>}</td>
              <td className={`${td} whitespace-nowrap text-right`}>
                {r.status === "pending" && (
                  <span className="flex justify-end gap-2">
                    <button className={btn} onClick={() => void resolve(r.id, "refunded")}>Mark refunded</button>
                    <button className={btn} onClick={() => { if (window.confirm(`Decline the refund for ${r.email}? They'll be emailed.`)) void resolve(r.id, "declined"); }}>Decline</button>
                  </span>
                )}
              </td>
            </tr>
          ))}
          {!data.requests.length && <tr><td className={`${td} text-muted`} colSpan={6}>No refund requests.</td></tr>}
        </Table>
      )}
    </div>
  );
}
