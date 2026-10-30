"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, btn, btnPrimary, card } from "@/components/account/dashboard/ui";
import { api } from "@/lib/account/client";

export const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

/** Admin sign-in: email, then the 6-digit code emailed to it (only addresses added as admins receive one). */
export function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await api("POST", "/admin/request-code", { email });
        setSent(true);
      } else {
        await api("POST", "/admin/verify", { email, code });
        router.replace("/admin/customers/");
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className={`${card} mx-auto max-w-sm space-y-3`}>
      <h1 className="text-lg font-semibold">Admin sign in</h1>
      <label className="block text-sm">
        <span className="mb-1 block text-muted">Email</span>
        <input className={input} type="email" autoComplete="email" required disabled={sent} value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      {sent && (
        <>
          <Alert tone="info">If that address is an admin, we&apos;ve emailed it a 6-digit code. It expires in 10 minutes.</Alert>
          <label className="block text-sm">
            <span className="mb-1 block text-muted">Code</span>
            <input className={`${input} tracking-[0.4em]`} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </label>
        </>
      )}
      {error && <Alert tone="error">{error}</Alert>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
        {busy ? "Please wait…" : sent ? "Sign in" : "Email me a code"}
      </button>
      {sent && (
        <button type="button" className={`${btn} w-full`} onClick={() => { setSent(false); setCode(""); setError(""); }}>
          Use a different email
        </button>
      )}
    </form>
  );
}
