"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/account/client";
import { card, SignOutIcon, signOutBtn } from "@/components/account/dashboard/ui";

export type AdminUser = { id: string; email: string; name: string; role: "superadmin" | "employee" };
const Ctx = createContext<AdminUser | null>(null);
export const useAdmin = () => useContext(Ctx) as AdminUser;

const NAV = [
  { group: "Customers", href: "/admin/customers/", label: "Customers" },
  { group: "Customers", href: "/admin/subscriptions/", label: "Subscriptions" },
  { group: "Customers", href: "/admin/refunds/", label: "Refunds" },
  { group: "Setup", href: "/admin/plans/", label: "Plans" },
  { group: "Setup", href: "/admin/employees/", label: "Employees", superOnly: true },
];

/** Gate for every /admin page except the login: asks the API who is signed in, else sends them to /admin/login/. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ admin: AdminUser }>("GET", "/admin/me")
      .then((r) => setAdmin(r.admin))
      .catch((e) => (e instanceof ApiError && e.status === 401 ? router.replace("/admin/login/") : setError("The admin API is unavailable. Try again in a moment.")));
  }, [router]);

  if (error) return <p className={card}>{error}</p>;
  if (!admin) return <div className="h-80 animate-pulse rounded-2xl bg-chip" />;

  const logout = async () => {
    await api("POST", "/admin/logout").catch(() => undefined);
    router.replace("/admin/login/");
  };
  const nav = NAV.filter((n) => !n.superOnly || admin.role === "superadmin");
  return (
    <Ctx.Provider value={admin}>
      <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col lg:gap-0.5">
            {nav.map((n, i) => (
              <div key={n.href} className="flex lg:block">
                {nav[i - 1]?.group !== n.group && <p className="hidden px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted first:pt-0 lg:block">{n.group}</p>}
                <Link
                  href={n.href}
                  aria-current={pathname.startsWith(n.href.slice(0, -1)) ? "page" : undefined}
                  className={`block whitespace-nowrap rounded-lg px-3 py-2 text-sm ${pathname.startsWith(n.href.slice(0, -1)) ? "bg-accent/10 font-semibold text-accent" : "text-muted hover:bg-chip hover:text-foreground"}`}
                >
                  {n.label}
                </Link>
              </div>
            ))}
            <button type="button" className={`${signOutBtn} ml-auto shrink-0 whitespace-nowrap lg:hidden`} onClick={logout}>
              <SignOutIcon /> Sign out
            </button>
          </nav>
          <div className="mt-4 hidden border-t border-border pt-4 text-xs text-muted lg:block">
            <p className="truncate">{admin.email}</p>
            <p className="mb-2 capitalize">{admin.role}</p>
            <button type="button" className={`${signOutBtn} w-full`} onClick={logout}>
              <SignOutIcon /> Sign out
            </button>
          </div>
        </aside>
        <section className="min-w-0">{children}</section>
      </div>
    </Ctx.Provider>
  );
}
