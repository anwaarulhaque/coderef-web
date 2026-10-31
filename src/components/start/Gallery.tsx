"use client";

// The community template gallery: public pages people published as templates. Preview any of them, or copy one
// to your own account in a click.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, openSignIn, useAccount } from "@/lib/account/client";
import { startApi, themeStyle, type GalleryTemplate } from "@/lib/start/client";
import { TEMPLATE_CATEGORIES, widgetDef } from "@/lib/start-plans";
import { btn, btnPrimary, input } from "./ui";

export function Gallery() {
  const router = useRouter();
  const { me } = useAccount();
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [list, setList] = useState<GalleryTemplate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQuery(q), 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    let live = true;
    startApi
      .gallery(category || undefined, query || undefined)
      .then((l) => live && setList(l))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, [category, query]);

  const use = async (t: GalleryTemplate) => {
    if (!me?.user) return openSignIn("Sign in or create a free account to use this template.");
    setBusy(t.shareId);
    setError(null);
    try {
      const r = await startApi.clone(t.shareId);
      router.push(`/start/${r.page.id}/`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't copy that template.");
      setBusy(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input className={`${input} max-w-xs`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search templates" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Category">
          {["", ...TEMPLATE_CATEGORIES].map((c) => (
            <button key={c || "all"} type="button" onClick={() => setCategory(c)} aria-pressed={category === c} className={`rounded-full border px-3 py-1 text-sm ${category === c ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface hover:border-accent"}`}>
              {c || "All"}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}{" "}
          <Link href="/pricing/?product=start" className="text-accent">
            See plans
          </Link>
        </p>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list === null &&
          [0, 1, 2].map((i) => <div key={i} className="h-56 animate-pulse rounded-2xl bg-chip" />)}
        {list?.map((t) => (
          <article key={t.shareId} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="h-24 bg-chip" style={themeStyle({ ...t.theme, scheme: "auto" })} aria-hidden />
            <div className="flex flex-1 flex-col p-4">
              <p className="text-xs text-muted">{t.category ?? "Personal"}</p>
              <h3 className="mt-0.5 font-semibold">
                {t.icon} {t.title}
              </h3>
              {t.description && <p className="mt-1 text-sm text-muted">{t.description}</p>}
              <p className="mt-2 line-clamp-2 text-xs text-muted">{t.types.map((x) => widgetDef(x)?.label ?? x).join(" · ")}</p>
              <p className="mt-2 text-xs text-muted">
                {t.widgets} widgets · used {t.clones} times
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" className={btnPrimary} onClick={() => use(t)} disabled={busy === t.shareId}>
                  {busy === t.shareId ? "Copying…" : "Use template"}
                </button>
                <Link href={`/start/p/${t.shareId}/`} className={btn}>
                  Preview
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {list?.length === 0 && <p className="mt-6 text-sm text-muted">No templates match yet. Be the first: publish one of your pages from its Share menu.</p>}
    </div>
  );
}
