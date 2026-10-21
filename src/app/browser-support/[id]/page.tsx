import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import examples from "../../../../data/compat-examples.json";
import { BaselineBadge } from "@/components/compat/CompatBits";
import { PageHeader, headerButton, headerButtonPrimary } from "@/components/layout/PageHeader";
import { CodeBlock } from "@/components/compat/CodeBlock";
import {
  BROWSERS,
  getCompatFeature,
  getCompatFeatures,
  getMovedFeatures,
  getReleases,
  type CompatFeature,
  type Release,
} from "@/lib/compat";
import { detectionFor } from "@/lib/compat-detect";
import { BASELINE_INFO, baselineKey } from "@/lib/compat-shared";

const EXAMPLES = examples as Record<string, { language: string; code: string }>;

// Only pre-built params exist (static export); anything else renders the 404 page.
export const dynamicParams = false;

export function generateStaticParams() {
  return [...getCompatFeatures().map((f) => f.id), ...getMovedFeatures().map((m) => m.id)].map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/browser-support/[id]">): Promise<Metadata> {
  const { id } = await params;
  const feature = getCompatFeature(id);
  // Renamed/split features just point elsewhere — keep them out of search results.
  if (!feature) return { title: "Moved feature", robots: { index: false, follow: true } };
  return pageMetadata({
    title: `${feature.name} — Browser Support & How to Use`,
    description: feature.description,
    path: `/browser-support/${feature.id}/`,
    type: "article",
  });
}

// Dataset descriptions may contain <code>; escape everything else.
function safeDescription(html: string) {
  const escaped = html.replace(/&(?!(amp|lt|gt|quot|#39);)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(/&lt;(\/?)code&gt;/g, "<$1code>");
}

const formatDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) : "";

function SupportTable({ feature, releases }: { feature: CompatFeature; releases: Record<string, Release[]> }) {
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-7 gap-2">
        {BROWSERS.map((b, i) => {
          const list = releases[b.id] ?? [];
          const current = list[list.length - 1];
          const v = feature.support[b.id];
          const first = list[0]?.version;
          const release = v ? list.find((r) => r.version === v.replace(/^≤/, "")) : undefined;
          const prevIndex = release ? list.indexOf(release) - 1 : -1;
          const showPlatform = i === 0 || BROWSERS[i - 1].platform !== b.platform;
          return (
            <div key={b.id} className="flex flex-col">
              <span className="h-4 text-[10px] font-medium uppercase tracking-wide text-muted">
                {showPlatform ? b.platform : ""}
              </span>
              <span className="mb-2 border-b border-border pb-1.5 text-sm font-semibold">{b.name}</span>
              {v ? (
                <>
                  {prevIndex >= 0 && (
                    <div className="mb-1 rounded-md bg-rose-500/15 px-2 py-2 text-center text-xs text-rose-700 dark:text-rose-300">
                      {first}–{list[prevIndex].version}
                      <span className="block text-[10px] opacity-80">Not supported</span>
                    </div>
                  )}
                  <div className="flex-1 rounded-md bg-emerald-500/20 px-2 py-3 text-center text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="block text-base font-semibold">{v}+</span>
                    Supported
                    {release && <span className="block text-[10px] opacity-80">since {formatDate(release.date)}</span>}
                  </div>
                </>
              ) : (
                <div className="flex-1 rounded-md bg-rose-500/15 px-2 py-3 text-center text-xs text-rose-700 dark:text-rose-300">
                  <span className="block text-base font-semibold">✕</span>
                  Not supported
                  {current && <span className="block text-[10px] opacity-80">up to {current.version}</span>}
                </div>
              )}
              {current && <span className="mt-1 text-center text-[10px] text-muted">Current: {current.version}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function prettyKey(key: string) {
  // Keep at-rules and value types distinguishable from same-named properties.
  if (key.startsWith("css.at-rules.")) return `@${key.slice("css.at-rules.".length)}`;
  if (key.startsWith("css.types.")) return key.slice("css.types.".length).replace(/^([^.]+)/, "<$1>");
  return key.replace(/^(css\.(properties|selectors|at-rules|types)|api|javascript\.(builtins|operators|statements|grammar)|html\.(elements|global_attributes)|svg\.elements)\./, "");
}

function SubFeatures({ feature }: { feature: CompatFeature }) {
  if (feature.compatKeys.length <= 1) return null;
  const rows = feature.compatKeys;
  const table = (items: typeof rows) => (
    <table className="w-full min-w-[760px] border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left text-[11px] text-muted">
          <th className="py-2 pr-3 font-medium">Sub-feature</th>
          {BROWSERS.map((b) => (
            <th key={b.id} className="w-20 px-1 py-2 text-center font-medium">
              {b.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((k) => (
          <tr key={k.key} className="border-b border-border last:border-b-0">
            <td className="py-1.5 pr-3 font-mono text-[12px]">
              {k.mdn ? (
                <a href={k.mdn} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">
                  {prettyKey(k.key)}
                </a>
              ) : (
                prettyKey(k.key)
              )}
            </td>
            {BROWSERS.map((b) => {
              const v = k.support[b.id];
              return (
                <td key={b.id} className="px-1 py-1.5 text-center">
                  <span
                    className={`inline-block min-w-12 rounded px-1.5 py-0.5 font-mono text-[11px] ${
                      v ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    {v ?? "✕"}
                  </span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return (
    <section className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-1 text-lg font-semibold">Sub-features</h2>
      <p className="mb-4 text-sm text-muted">
        Support for each part of the feature ({rows.length}). The overall table above shows when the whole feature works.
      </p>
      <div className="overflow-x-auto">{table(rows.slice(0, 20))}</div>
      {rows.length > 20 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm text-accent">Show {rows.length - 20} more</summary>
          <div className="overflow-x-auto">{table(rows.slice(20))}</div>
        </details>
      )}
    </section>
  );
}

function HowToUse({ feature }: { feature: CompatFeature }) {
  const example = EXAMPLES[feature.id];
  const detection = detectionFor(feature.compatKeys.map((k) => k.key), feature.id);
  const missing = BROWSERS.filter((b) => !feature.support[b.id]).map((b) => b.name);

  const advice =
    feature.baseline === "high"
      ? "This feature is Baseline widely available — use it freely, no fallback needed."
      : feature.baseline === "low"
        ? `Every current browser supports this, but it only became Baseline on ${formatDate(feature.baselineLowDate)}. Use it as a progressive enhancement, or keep a fallback if you support older devices.`
        : missing.length
          ? `Not supported in ${missing.join(", ")}. Use feature detection below and provide a fallback (or a polyfill) for those browsers.`
          : "Support is still inconsistent across browsers. Use feature detection and test carefully.";

  return (
    <section id="how-to-use" className="mb-8 rounded-xl border border-border bg-surface p-5">
      <h2 className="mb-3 text-lg font-semibold">How to use</h2>
      <p className="mb-5 rounded-lg border border-border bg-background px-4 py-3 text-sm">{advice}</p>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        {example ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Example</h3>
            <CodeBlock code={example.code} language={example.language} />
          </div>
        ) : (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Example</h3>
            <p className="text-sm text-muted">
              Full syntax and examples are on MDN
              {feature.mdn[0] ? (
                <>
                  :{" "}
                  <a href={feature.mdn[0].url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {feature.mdn[0].title}
                  </a>
                </>
              ) : (
                " — see the links below"
              )}
              .
            </p>
          </div>
        )}
        <div>
          <h3 className="mb-2 text-sm font-semibold">Feature detection</h3>
          {detection ? (
            <>
              <CodeBlock code={detection.code} language={detection.language} title={`${detection.language.toUpperCase()} · check before using`} />
              {detection.note && <p className="mt-2 text-xs text-muted">{detection.note}</p>}
            </>
          ) : (
            <p className="text-sm text-muted">
              There’s no simple runtime check for this feature; rely on the support table and test in your target
              browsers.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-3 [&>*]:min-w-0">
        {feature.mdn.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Documentation (MDN)</h3>
            <ul className="space-y-1 text-sm">
              {feature.mdn.map((m) => (
                <li key={m.url}>
                  <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {m.title} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {feature.spec.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Specification</h3>
            <ul className="space-y-1 text-sm">
              {feature.spec.map((url) => (
                <li key={url} className="truncate">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {new URL(url).hostname}
                    {new URL(url).hash || new URL(url).pathname.replace(/\/$/, "")} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        {feature.caniuse.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Usage share</h3>
            <ul className="space-y-1 text-sm">
              {feature.caniuse.map((id) => (
                <li key={id}>
                  <a href={`https://caniuse.com/${id}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    caniuse.com/{id} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function FeaturePage({ params }: PageProps<"/browser-support/[id]">) {
  const { id } = await params;
  const feature = getCompatFeature(id);

  if (!feature) {
    const moved = getMovedFeatures().find((m) => m.id === id);
    if (!moved) notFound();
    return (
      <div className="max-w-2xl">
        <h1 className="mb-3 text-2xl font-semibold">This feature was {moved.kind === "moved" ? "renamed" : "split up"}</h1>
        <p className="mb-4 text-muted">“{id}” is now tracked as:</p>
        <ul className="list-disc pl-5">
          {moved.targets.map((t) => (
            <li key={t}>
              <Link href={`/browser-support/${t}/`} className="text-accent hover:underline">
                {getCompatFeature(t)?.name ?? t}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const releases = getReleases();
  const info = BASELINE_INFO[baselineKey(feature.baseline)];

  return (
    <>
      <PageHeader
        title={
          <>
            {feature.name}
            <BaselineBadge baseline={feature.baseline} size="md" />
          </>
        }
        crumbs={[{ href: "/", label: "Home" }, { href: "/browser-support/", label: "Browser Support" }, { label: feature.category }, { label: feature.name }]}
        actions={
          <>
            <a href="#how-to-use" className={headerButtonPrimary}>
              How to use ↓
            </a>
            <Link href="/browser-support/compare/" className={headerButton}>
              Compare browsers
            </Link>
          </>
        }
      >
        <p className="mt-3 max-w-3xl text-muted [&_code]:rounded [&_code]:bg-chip [&_code]:px-1 [&_code]:font-mono [&_code]:text-[0.9em]" dangerouslySetInnerHTML={{ __html: safeDescription(feature.descriptionHtml) }} />
        <p className="mt-2 text-sm text-muted">
          {info.text}
          {feature.baselineLowDate && <> Baseline since {formatDate(feature.baselineLowDate)}.</>}
          {feature.baselineHighDate && <> Widely available since {formatDate(feature.baselineHighDate)}.</>}
        </p>
        {feature.discouraged && (
          <p className="mt-3 rounded-lg border border-amber-600/30 bg-amber-500/10 px-4 py-2 text-sm">
            <strong>Discouraged:</strong> {feature.discouraged.reason || "Avoid using this feature in new code."}
            {feature.discouraged.alternatives.length > 0 && (
              <>
                {" "}
                Use instead:{" "}
                {feature.discouraged.alternatives.map((alt, i) => (
                  <span key={alt}>
                    {i > 0 && ", "}
                    <Link href={`/browser-support/${alt}/`} className="text-accent hover:underline">
                      {getCompatFeature(alt)?.name ?? alt}
                    </Link>
                  </span>
                ))}
              </>
            )}
          </p>
        )}
      </PageHeader>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-lg font-semibold">Browser support</h2>
        <SupportTable feature={feature} releases={releases} />
      </section>

      <HowToUse feature={feature} />
      <SubFeatures feature={feature} />
    </>
  );
}
