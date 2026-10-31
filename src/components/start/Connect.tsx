"use client";

// /start/connect/: connects the CodeRef Start browser extension. Issues a scoped token (crt_…) and posts it to this
// page, where the extension's content script (coderef-chrome-extension/connect.js) picks it up and answers. The page
// also pings the extension first, to show whether it is installed.
import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, openSignIn, useAccount } from "@/lib/account/client";
import { startApi } from "@/lib/start/client";
import { BrandMark } from "@/components/layout/BrandMark";
import { Icon } from "./ui";

type Device = Awaited<ReturnType<typeof startApi.tokens>>[number];
type State = "idle" | "busy" | "connected" | "manual";

const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);

function browserName() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Brave/.test(ua) ? "Brave" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Mac/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /CrOS/.test(ua) ? "ChromeOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${browser}${os ? ` on ${os}` : ""}`;
}

const BROWSER_COLORS: Record<string, string> = { Chrome: "#1a73e8", Edge: "#0f7cd6", Brave: "#fb542b", Opera: "#ff1b2d", Firefox: "#ff7139" };
const day = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Has this browser got the extension? Asks its content script and waits a moment for the answer. */
function useExtension() {
  const [found, setFound] = useState<null | { version: string } | false>(null);
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source === window && e.origin === window.location.origin && e.data?.type === "coderef-extension-present") setFound({ version: String(e.data.version ?? "") });
    };
    window.addEventListener("message", onMsg);
    // The content script may still be loading: ask twice.
    const ask = () => window.postMessage({ type: "coderef-extension-ping" }, window.location.origin);
    ask();
    const again = setTimeout(ask, 600);
    const giveUp = setTimeout(() => setFound((f) => f ?? false), 1500);
    return () => {
      window.removeEventListener("message", onMsg);
      clearTimeout(again);
      clearTimeout(giveUp);
    };
  }, []);
  return found;
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-500 text-white" : "border border-border bg-background text-muted"}`}
        aria-hidden
      >
        {done ? <Icon name="check" size={14} /> : n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{title}</p>
        <div className="mt-0.5 text-sm text-muted">{children}</div>
      </div>
    </li>
  );
}

/** The browser ↔ account picture at the top of the card; turns green once connected. */
function Link2({ connected, email, browser }: { connected: boolean; email?: string; browser: string }) {
  const tile = "flex w-36 flex-col items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-4 text-center shadow-sm";
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4" aria-hidden>
      <div className={tile}>
        <span className="flex size-11 items-center justify-center rounded-xl bg-chip text-foreground">
          <Icon name="puzzle" size={22} />
        </span>
        <span className="text-xs font-semibold">CodeRef Start</span>
        <span className="max-w-full truncate text-[11px] text-muted">{browser}</span>
      </div>
      <div className="relative flex w-16 items-center sm:w-28">
        <span className={`h-0.5 w-full rounded-full ${connected ? "bg-emerald-500" : "bg-[repeating-linear-gradient(90deg,var(--border)_0_6px,transparent_6px_12px)]"}`} />
        <span
          className={`absolute left-1/2 flex size-9 -translate-x-1/2 items-center justify-center rounded-full border shadow-sm transition-colors ${
            connected ? "border-emerald-500 bg-emerald-500 text-white" : "border-border bg-surface text-accent"
          }`}
        >
          <Icon name={connected ? "check" : "lock"} size={16} />
        </span>
      </div>
      <div className={tile}>
        <BrandMark size={44} gradientId="cr-mark-connect" />
        <span className="text-xs font-semibold">Your account</span>
        <span className="max-w-full truncate text-[11px] text-muted">{email ?? "Not signed in"}</span>
      </div>
    </div>
  );
}

export function ConnectPage() {
  const { me, status } = useAccount();
  const email = me?.user?.email;
  const signedIn = !!email;
  const extension = useExtension();
  const [browser, setBrowser] = useState("This browser");
  const [devices, setDevices] = useState<Device[]>([]);
  const [state, setState] = useState<State>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () =>
    startApi
      .tokens()
      .then(setDevices)
      .catch(() => undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the browser's name is only known in the browser
    setBrowser(browserName());
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    void refresh();
    const onMsg = (e: MessageEvent) => {
      if (e.source === window && e.origin === window.location.origin && e.data?.type === "coderef-extension-connected") {
        setState("connected");
        void refresh();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [signedIn]);

  const connect = async () => {
    setState("busy");
    setError(null);
    try {
      const t = await startApi.createToken(browserName());
      setToken(t);
      window.postMessage({ type: "coderef-extension-token", token: t }, window.location.origin);
      // No answer means the extension isn't installed here (or is an older build): show the token to paste instead.
      setTimeout(() => setState((s) => (s === "busy" ? "manual" : s)), 2000);
    } catch (e) {
      setError(errText(e, "Couldn't create an access token. Try again in a moment."));
      setState("idle");
    }
  };

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const connected = state === "connected";
  const installed = !!extension;
  const mod = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "⌘" : "Ctrl";

  return (
    <div className="relative min-h-full">
      {/* Soft brand glow behind the card. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(40rem_20rem_at_20%_0%,rgb(59_130_246/0.16),transparent_70%),radial-gradient(36rem_18rem_at_90%_0%,rgb(99_102_241/0.14),transparent_70%)]" />

      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-6 sm:pt-10">
        <header className="flex items-center justify-between">
          <Link href="/start/" className="flex items-center gap-2 font-semibold tracking-tight">
            <BrandMark size={28} gradientId="cr-mark-connect-head" />
            CodeRef Start
          </Link>
          <Link href={signedIn ? "/start/" : "/start-page/"} className="text-sm text-muted hover:text-accent">
            {signedIn ? "My start page →" : "What is CodeRef Start? →"}
          </Link>
        </header>

        <main className="mt-8 overflow-hidden rounded-3xl border border-border bg-surface shadow-xl shadow-black/5">
          <div className="border-b border-border bg-gradient-to-b from-accent/10 to-transparent px-6 py-8">
            <Link2 connected={connected} email={email} browser={browser} />
          </div>

          <div className="px-6 py-7 sm:px-8">
            {connected ? (
              <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight">You&apos;re connected</h1>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  {browser} now opens your start page in every new tab, and the toolbar button saves pages and tabs to it.
                </p>
                <p className="mt-5 text-sm text-muted">
                  Open a new tab to see it:{" "}
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">{mod}</kbd>{" "}
                  <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs">T</kbd>
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link href="/start/" className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-white hover:opacity-90">
                    Go to my start page
                  </Link>
                  <Link href="/start-page/extension/" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:border-accent hover:text-accent">
                    Tips for the extension
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Connect your browser</h1>
                <p className="mt-2 text-muted">
                  Link the CodeRef Start extension to your account. Your start page then opens in every new tab, and you can save pages and tabs in one
                  click.
                </p>

                <ol className="mt-6 space-y-4">
                  <Step n={1} done={installed} title={installed ? "Extension installed" : "Install the extension"}>
                    {extension === null ? (
                      "Checking this browser…"
                    ) : installed ? (
                      <>Found CodeRef Start{extension.version ? ` ${extension.version}` : ""} in {browser}.</>
                    ) : (
                      <>
                        Not found in this browser.{" "}
                        <Link href="/start-page/extension/" className="font-medium text-accent hover:underline">
                          Get the extension
                        </Link>
                        , then come back to this page.
                      </>
                    )}
                  </Step>
                  <Step n={2} done={signedIn} title={signedIn ? "Signed in" : "Sign in to CodeRef"}>
                    {signedIn ? (
                      <>As {email}</>
                    ) : status === "loading" ? (
                      "Checking…"
                    ) : (
                      <button type="button" onClick={() => openSignIn("Sign in to connect the CodeRef Start extension.")} className="font-medium text-accent hover:underline">
                        Sign in or create a free account
                      </button>
                    )}
                  </Step>
                  <Step n={3} done={false} title="Connect">
                    Gives this browser a key that only works for your start pages.
                  </Step>
                </ol>

                {signedIn ? (
                  <button
                    type="button"
                    onClick={connect}
                    disabled={state === "busy"}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
                  >
                    {state === "busy" ? (
                      <>
                        <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden /> Connecting…
                      </>
                    ) : (
                      <>
                        Connect {browser.split(" on ")[0]} <span aria-hidden>→</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openSignIn("Sign in to connect the CodeRef Start extension.")}
                    className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-base font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    Sign in to connect <span aria-hidden>→</span>
                  </button>
                )}

                {error && (
                  <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                {state === "manual" && token && (
                  <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                    <p className="text-sm font-semibold">The extension didn&apos;t answer</p>
                    <p className="mt-1 text-sm text-muted">
                      Paste this key into the extension instead: click the CodeRef Start icon → Settings → <em>Connect with an access token</em>. It&apos;s
                      shown only once.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <input
                        readOnly
                        value={token}
                        onFocus={(e) => e.target.select()}
                        aria-label="Access token"
                        className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-accent"
                      />
                      <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium hover:border-accent hover:text-accent">
                        <Icon name={copied ? "check" : "copy"} size={14} /> {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <ul className="grid gap-px border-t border-border bg-border text-sm sm:grid-cols-3">
            {[
              ["lock", "Only your start pages", "The key can't read your account, billing or other sites."],
              ["check", "Talks to coderef.xyz only", "Your key is never sent anywhere else."],
              ["close", "Remove any time", "Disconnect a browser below or in Account."],
            ].map(([icon, title, text]) => (
              <li key={title} className="flex gap-3 bg-surface px-5 py-4">
                <span className="mt-0.5 text-accent">
                  <Icon name={icon} size={16} />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="text-xs text-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </main>

        {signedIn && (
          <section className="mt-8" aria-labelledby="devices-title">
            <div className="flex items-baseline justify-between">
              <h2 id="devices-title" className="font-semibold">
                Connected browsers
              </h2>
              <span className="text-xs text-muted">{devices.length} of 20</span>
            </div>
            <ul className="mt-3 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {!devices.length && <li className="px-5 py-6 text-center text-sm text-muted">No browsers yet. Connect this one above.</li>}
              {devices.map((d) => {
                const name = d.name.split(" on ")[0];
                return (
                  <li key={d.id} className="flex items-center gap-4 px-5 py-4">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ background: BROWSER_COLORS[name] ?? "var(--accent)" }}
                      aria-hidden
                    >
                      {name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{d.name}</span>
                      <span className="block text-xs text-muted">
                        Connected {day(d.createdAt)} · {d.lastUsedAt ? `last used ${day(d.lastUsedAt)}` : "not used yet"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-red-500/10 hover:text-red-600"
                      onClick={async () => {
                        await startApi.deleteToken(d.id).catch(() => undefined);
                        void refresh();
                      }}
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <p className="mt-8 text-center text-xs text-muted">
          Works in Chrome, Edge, Brave and other Chromium browsers.{" "}
          <Link href="/start-page/extension/#faq" className="hover:text-accent hover:underline">
            Questions?
          </Link>
        </p>
      </div>
    </div>
  );
}
