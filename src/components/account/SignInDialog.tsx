"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, closeSignIn, refreshAccount, useAccount } from "@/lib/account/client";

/** The email form and code step, usable inline (account page) or inside the dialog. */
export function SignInForm({ reason, onDone }: { reason?: string | null; onDone?: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ isNewAccount: boolean }>("POST", "/auth/request-code", { email });
      setIsNew(r.isNewAccount);
      setStep("code");
      setCooldown(30);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send the code. Check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    setBusy(true);
    setError(null);
    try {
      await api("POST", "/auth/verify", { email, code: value });
      await refreshAccount();
      onDone?.();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not verify the code.");
      setBusy(false);
    }
  };

  const input = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
  const primary = "w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-surface hover:opacity-90 disabled:opacity-50";

  return step === "email" ? (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      className="space-y-3"
    >
      {reason && <p className="rounded-lg bg-chip px-3 py-2 text-sm">{reason}</p>}
      <label className="block text-sm font-medium">
        Email
        <input type="email" required autoFocus autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={`${input} mt-1.5`} />
      </label>
      <button type="submit" disabled={busy || !email} className={primary}>
        {busy ? "Sending…" : "Continue with email"}
      </button>
      <p className="text-xs text-muted">We&apos;ll email you a 6-digit code to verify your address. New here? This creates your free account. No password needed.</p>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
      className="space-y-3"
    >
      <p className="text-sm">
        We sent a code to <span className="font-semibold">{email}</span>. {isNew ? "Enter it to verify your email and create your account." : "Enter it to sign in."}
      </p>
      <input
        ref={codeRef}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        aria-label="6-digit code"
        value={code}
        onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").slice(0, 6);
          setCode(v);
          if (v.length === 6) void verify(v);
        }}
        className={`${input} text-center font-mono text-2xl tracking-[0.5em]`}
        placeholder="••••••"
      />
      <button type="submit" disabled={busy || code.length !== 6} className={primary}>
        {busy ? "Verifying…" : isNew ? "Verify and create account" : "Sign in"}
      </button>
      <div className="flex justify-between text-xs text-muted">
        <button type="button" className="hover:text-foreground" onClick={() => { setStep("email"); setCode(""); setError(null); }}>
          ← Different email
        </button>
        <button type="button" disabled={cooldown > 0 || busy} className="hover:text-foreground disabled:opacity-60" onClick={() => void send()}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
      <p className="text-xs text-muted">Check your spam folder if it doesn&apos;t arrive. The email comes from noreply@mail.coderef.xyz.</p>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

/** Global sign-in dialog, opened by openSignIn() from anywhere. */
export function SignInDialog() {
  const { signInOpen, signInReason } = useAccount();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (signInOpen && !d.open) d.showModal();
    if (!signInOpen && d.open) d.close();
  }, [signInOpen]);

  return (
    <dialog
      ref={ref}
      onClose={closeSignIn}
      onClick={(e) => e.target === ref.current && closeSignIn()}
      aria-labelledby="signin-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      {signInOpen && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 id="signin-title" className="text-lg font-semibold">
                Sign in or create an account
              </h2>
              <p className="mt-1 text-sm text-muted">Save your work, sync across devices and unlock Pro.</p>
            </div>
            <button type="button" onClick={closeSignIn} aria-label="Close" className="-mr-2 -mt-1 rounded-lg p-2 text-muted hover:bg-chip hover:text-foreground">
              ✕
            </button>
          </div>
          <SignInForm reason={signInReason} onDone={closeSignIn} />
        </div>
      )}
    </dialog>
  );
}
