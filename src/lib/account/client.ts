// Browser side of accounts: one shared store for "who is signed in", plus typed calls to /api.
import { useSyncExternalStore } from "react";
import type { ItemKind, PlanId } from "@/lib/plans";

export type AccountUser = { email: string; createdAt: string; pro: boolean; plan: PlanId | null; status: string | null; proUntil: string | null; billing: boolean };
export type Usage = { saved: number; favorites: number; limit: number };
export type Me = { user: AccountUser | null; usage?: Usage; lifetimeRemaining: number; /** False while paid plans are "coming soon". */ paymentsEnabled: boolean };
export type SavedItem<T = unknown> = { id: string; kind: ItemKind; title: string; shareId: string | null; createdAt: string; updatedAt: string; data?: T };

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** JSON call to /api. Paths keep a trailing slash so neither next dev nor CloudFront redirects them. */
export async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const [p, q] = path.split("?");
  const res = await fetch(`/api${p.replace(/\/?$/, "/")}${q ? `?${q}` : ""}`, {
    method,
    credentials: "same-origin",
    headers: body === undefined && method === "GET" ? undefined : { "content-type": "application/json" },
    body: body === undefined ? (method === "GET" ? undefined : "{}") : JSON.stringify(body),
  });
  const data = res.headers.get("content-type")?.includes("application/json") ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "error", data?.message ?? (res.status >= 500 ? "Something went wrong. Please try again." : "Request failed"));
  return data as T;
}

/** POST that returns a file; saves it with the server's filename. */
export async function download(path: string, body: unknown, fallbackName: string): Promise<void> {
  const res = await fetch(`/api${path.replace(/\/?$/, "/")}`, { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data?.error ?? "error", data?.message ?? "Download failed");
  }
  const name = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- shared account store ----

type State = { status: "loading" | "ready" | "offline"; me: Me | null; signInOpen: boolean; signInReason: string | null };
let state: State = { status: "loading", me: null, signInOpen: false, signInReason: null };
const listeners = new Set<() => void>();
let started = false;
let firstLoad: Promise<Me | null> | null = null;

/** Resolves once the signed-in state is known (starts the request if nothing has yet). */
function accountReady(): Promise<Me | null> {
  if (state.status !== "loading") return Promise.resolve(state.me);
  if (!started) {
    started = true;
    firstLoad = refreshAccount();
  }
  return firstLoad ?? refreshAccount();
}

const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

export async function refreshAccount(): Promise<Me | null> {
  try {
    const me = await api<Me>("GET", "/me");
    set({ status: "ready", me });
    return me;
  } catch {
    // API unreachable (e.g. local dev without npm run api:dev): the site keeps working signed-out.
    set({ status: "offline", me: { user: null, lifetimeRemaining: 0, paymentsEnabled: false } });
    return null;
  }
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (!started) {
    started = true;
    firstLoad = refreshAccount();
  }
  return () => listeners.delete(l);
}

const SERVER: State = { status: "loading", me: null, signInOpen: false, signInReason: null };
export const useAccount = () => useSyncExternalStore(subscribe, () => state, () => SERVER);

/** Whether paid plans can be bought yet; false shows "Coming soon" instead of buy buttons. */
export const usePaymentsOpen = () => !!useAccount().me?.paymentsEnabled;

export const openSignIn = (reason: string | null = null) => set({ signInOpen: true, signInReason: reason });
export const closeSignIn = () => set({ signInOpen: false, signInReason: null });

export async function signOut() {
  await api("POST", "/auth/logout").catch(() => undefined);
  await refreshAccount();
}

/**
 * Gate for a Pro action: signed-out users get the sign-in dialog, free users go to pricing. Returns true when the
 * caller may go ahead.
 */
export async function requirePro(feature: string): Promise<boolean> {
  const user = (await accountReady())?.user ?? state.me?.user;
  if (!user) {
    openSignIn(`Sign in to use ${feature}.`);
    return false;
  }
  if (!user.pro) {
    // Plain function (no router in scope); a full load of a static page is fine here.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/pricing/?feature=${encodeURIComponent(feature)}`);
    return false;
  }
  return true;
}

export async function requireAccount(reason: string): Promise<boolean> {
  if ((await accountReady())?.user ?? state.me?.user) return true;
  openSignIn(reason);
  return false;
}

/** Opens Dodo's hosted checkout for a plan (the caller makes sure someone is signed in). */
export async function startCheckout(plan: PlanId): Promise<void> {
  const { url } = await api<{ url: string }>("POST", "/billing/checkout", { plan });
  window.location.assign(url);
}

export type SubscriptionDetails = { status: string | null; cancelAtPeriodEnd: boolean; nextBillingDate: string | null };

export type Transaction = { id: string; date: string; kind: "payment" | "refund" | "failed"; plan: PlanId | null; description: string; amount: number | null; currency: string | null; refundable?: boolean; refundState?: "pending" | "refunded" | "declined" | null };

export const TOOL_PATHS: Record<Exclude<ItemKind, "favorite">, { path: string; label: string }> = {
  palette: { path: "/realtime-colors/", label: "Realtime Colors" },
  "api-request": { path: "/rest-api-client/", label: "REST API client" },
  regex: { path: "/regex-tester/", label: "Regex tester" },
  markdown: { path: "/markdown/", label: "Markdown editor" },
  json: { path: "/json-formatter/", label: "JSON formatter" },
};
