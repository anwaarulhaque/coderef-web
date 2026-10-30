import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";

/** Shared layout for the terms, privacy, cookie, refund and cancellation pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHeader title={title} crumbs={[{ href: "/", label: "Home" }, { label: title }]} description={`Last updated ${updated}`} />
      <article className="max-w-3xl space-y-4 text-[15px] leading-7 [&_a]:text-accent [&_a]:underline [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </article>
    </>
  );
}
