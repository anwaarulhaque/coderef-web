import type { Metadata } from "next";
import Link from "next/link";
import { ApiClient } from "@/components/api/ApiClient";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "REST API Client — Test APIs Online, Like Postman",
  description:
    "Free online REST API client: send GET, POST, PUT, PATCH and DELETE requests with params, headers, JSON or form bodies and auth. Inspect responses, keep history, use variables, import cURL and generate code.",
  path: "/rest-api-client/",
});

const kbd = "rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[12px]";

const FAQ = [
  ["Why do some requests fail with a network or CORS error?", "This client runs in your browser, so the browser's CORS rules apply: the API has to allow requests from other websites (Access-Control-Allow-Origin). Public APIs meant for browsers do; many private APIs don't. Postman and cURL aren't browsers, so they skip this check — use Code → cURL to run the same request from a terminal."],
  ["Are my requests or tokens sent to coderef?", "No. Requests go straight from your browser to the API. History, saved requests and variables are kept only in this browser's local storage."],
  ["Why can't I set the User-Agent, Cookie or Origin header?", "Browsers don't allow web pages to set those headers, so they're dropped. The Headers tab warns you when you add one."],
  ["Can I use environment variables?", "Yes. Add them under Variables and write {{name}} anywhere in the URL, params, headers, body or auth. Generated code snippets use their current values."],
  ["Which code languages can it generate?", "cURL, JavaScript (fetch and axios), Python (requests) and PHP (cURL)."],
];

const LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "REST API Client",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: ["GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS", "Query params, headers, JSON, XML, form and multipart bodies", "Bearer, Basic and API key auth", "Variables", "History and saved requests", "Import cURL", "Code generation"],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "REST API Client", item: absoluteUrl("/rest-api-client/") },
    ],
  },
];

export default function RestApiClientPage() {
  return (
    <>
      {LD.map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={jsonLd(data)} />
      ))}
      <ApiClient
        heading={
          <div className="mr-2 flex items-baseline gap-2">
            <h1 className="text-lg font-semibold tracking-tight">REST API Client</h1>
            <nav aria-label="Breadcrumb" className="hidden text-xs text-muted xl:block">
              <Link href="/" className="hover:text-foreground">Home</Link> / Compilers
            </nav>
          </div>
        }
      />

      <div className="mx-auto max-w-7xl px-4 pb-4">
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">Online REST API client</h2>
          <p className="mt-2 max-w-3xl text-muted">
            Build an HTTP request, send it, and inspect the response — status, timing, headers and a formatted body — without installing anything.
            JSON responses can be explored further in the <Link href="/json-formatter/" className="text-accent hover:underline">JSON Formatter</Link>.
          </p>
        </section>

        <details open className="group mt-8 rounded-xl border border-border bg-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3">
            <span className="font-semibold">How to use</span>
            <span className="text-sm text-muted group-open:hidden">Show guide ▾</span>
            <span className="hidden text-sm text-muted group-open:inline">Hide guide ▴</span>
          </summary>
          <div className="grid gap-6 border-t border-border px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold">1. Build the request</h3>
              <p className="text-sm text-muted">
                Pick a method and enter the URL. Add <strong>Params</strong>, <strong>Headers</strong>, a <strong>Body</strong> (JSON, text, XML or form) and{" "}
                <strong>Auth</strong>. Or start from a <strong>Sample</strong>.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">2. Send</h3>
              <p className="text-sm text-muted">
                Press <strong>Send</strong> or <kbd className={kbd}>Ctrl/⌘</kbd>+<kbd className={kbd}>Enter</kbd>. See the status, time and size; switch the body
                between Pretty, Raw and Preview.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">3. Reuse</h3>
              <p className="text-sm text-muted">
                Every request lands in <strong>History</strong>; <strong>Save</strong> the ones you need. Put base URLs and tokens in <strong>Variables</strong> and write{" "}
                <code className={kbd}>{"{{name}}"}</code>.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">4. Move to code</h3>
              <p className="text-sm text-muted">
                <strong>Import cURL</strong> (or paste one into the URL bar) to load a request; <strong>Code</strong> turns the request into cURL, fetch, axios, Python or
                PHP.
              </p>
            </div>
          </div>
        </details>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
          <div className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group px-5 py-3">
                <summary className="cursor-pointer list-none font-medium">
                  <span className="mr-2 inline-block text-muted transition-transform group-open:rotate-90">›</span>
                  {q}
                </summary>
                <p className="mt-2 pl-4 text-sm text-muted">{a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
