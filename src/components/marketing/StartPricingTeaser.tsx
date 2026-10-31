// A compact version of the CodeRef Start plans for marketing pages; the full table is on /pricing/?product=start.
import Link from "next/link";
import { START_PLANS } from "@/lib/start-plans";

export function StartPricingTeaser() {
  const plans = [
    { name: "Free", price: "$0", period: "forever", text: "3 pages, essential widgets, new tab and sharing." },
    ...START_PLANS.map((p) => ({ name: p.name, price: p.price, period: p.period, text: p.note })),
    { name: "Start Enterprise", price: "Custom", period: "", text: "Unlimited teams, SSO, managed rollout and support." },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((p) => (
        <div key={p.name} className={`rounded-2xl border bg-surface p-5 ${p.name === "Start PRO" ? "border-accent ring-1 ring-accent" : "border-border"}`}>
          <p className="font-semibold">{p.name}</p>
          <p className="mt-2">
            <span className="text-3xl font-bold tracking-tight">{p.price}</span>
            <span className="ml-1 text-sm text-muted">{p.period}</span>
          </p>
          <p className="mt-2 text-sm text-muted">{p.text}</p>
        </div>
      ))}
      <p className="text-sm text-muted sm:col-span-2 lg:col-span-4">
        <Link href="/pricing/?product=start" className="font-semibold text-accent">
          Compare every feature →
        </Link>
      </p>
    </div>
  );
}
