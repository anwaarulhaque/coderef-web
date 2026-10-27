import Link from "next/link";
import { type DesignIndexEntry, designHref, previewColors, readableOn, shotHref } from "@/lib/design-md-shared";

/** A design as a 3:4 tile: the top of its live site when captured, otherwise a tiny mock in its own colors. */
export function DesignCard({ d, collectionLabel }: { d: DesignIndexEntry; collectionLabel?: string }) {
  const { bg, fg, accent } = previewColors(d.p, d.t);
  const font = d.f[0];
  return (
    <Link href={designHref(d.i)} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-md">
      <div className="relative aspect-[3/4] overflow-hidden border-b border-border" style={{ backgroundColor: bg, color: fg }}>
        {d.x ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized webp
          <img
            src={shotHref(d.i, "thumb", d.x)}
            alt={`${d.n} website`}
            width={600}
            height={800}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 size-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full flex-col justify-between p-5">
            <div className="flex items-center justify-between gap-2 text-[11px] opacity-70" aria-hidden>
              <span className="size-3 rounded-full" style={{ backgroundColor: accent }} />
              <span className="flex gap-3">
                <span>Product</span>
                <span>Pricing</span>
              </span>
            </div>
            <div>
              <span className="block text-2xl font-semibold leading-tight tracking-tight" style={font ? { fontFamily: `"${font}", var(--font-geist-sans), sans-serif` } : undefined}>
                {d.n}
              </span>
              <div className="mt-3 space-y-1.5" aria-hidden>
                <div className="h-1.5 w-32 rounded-full opacity-70" style={{ backgroundColor: fg }} />
                <div className="h-1.5 w-20 rounded-full opacity-40" style={{ backgroundColor: fg }} />
              </div>
              <span className="mt-4 inline-block rounded-full px-3 py-1 text-[11px] font-semibold" style={{ backgroundColor: accent, color: readableOn(accent) }}>
                Button
              </span>
            </div>
            <div className="flex -space-x-1.5" aria-label="Palette">
              {d.p.slice(0, 5).map((c) => (
                <span key={c} className="size-5 rounded-full ring-2" style={{ backgroundColor: c, ["--tw-ring-color" as string]: bg }} title={c} />
              ))}
            </div>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-end justify-between gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pt-14 pb-4 text-sm text-white opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <span className="truncate">{d.n} DESIGN.md</span>
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">View →</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold group-hover:text-accent">{d.n}</h3>
          <span className="shrink-0 rounded-full bg-chip px-2 py-0.5 text-[11px] text-muted">
            {d.g !== collectionLabel && d.g.toLowerCase() !== d.c ? d.g : (collectionLabel ?? d.c)}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{d.s}</p>
        <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted">
          {d.x && (
            <span className="flex shrink-0 -space-x-1" aria-hidden>
              {d.p.slice(0, 4).map((c) => (
                <span key={c} className="size-2.5 rounded-full ring-1 ring-surface" style={{ backgroundColor: c }} />
              ))}
            </span>
          )}
          <span>{d.t === "dark" ? "◐ Dark" : "○ Light"}</span>
          {font && <span className="truncate">· {font}</span>}
          {d.v > 1 && <span className="shrink-0">· {d.v} platforms</span>}
        </p>
      </div>
    </Link>
  );
}
