"use client";

import { useEffect, useRef, useState } from "react";
import { copyText } from "@/components/quickref/Snippet";
import { cdnFetchPath, designFileHref } from "@/lib/design-md-shared";

export type DesignVariant = { file: string; label: string; html: string; toc: { id: string; title: string }[] };

/** The rendered DESIGN.md (and platform variants as tabs) with a sticky table of contents. */
export function DesignDocument({ id, variants, tokens }: { id: string; variants: DesignVariant[]; tokens: string | null }) {
  const [active, setActive] = useState(0);
  const v = variants[active];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="no-print hidden lg:block">
        <nav aria-label="On this page" className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">On this page</p>
          <ol className="space-y-1.5 border-l border-border">
            {tokens && (
              <li>
                <a href="#design-tokens" className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-foreground">
                  Design tokens
                </a>
              </li>
            )}
            {v.toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="-ml-px block border-l border-transparent pl-3 text-muted hover:border-accent hover:text-foreground">
                  {t.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          {variants.length > 1 ? (
            <div role="tablist" aria-label="Platform" className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface p-1">
              {variants.map((x, i) => (
                <button
                  key={x.file}
                  role="tab"
                  type="button"
                  aria-selected={i === active}
                  onClick={() => setActive(i)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium ${i === active ? "bg-accent text-surface" : "text-muted hover:text-foreground"}`}
                >
                  {x.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="font-mono text-sm text-muted">{v.file}</p>
          )}
          <FileActions id={id} file={v.file} />
        </div>

        <article className="rounded-xl border border-border bg-surface p-5 md:p-8">
          {tokens && active === 0 && (
            <details id="design-tokens" className="mb-6 scroll-mt-20 rounded-lg border border-border bg-background/50">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Design tokens (YAML front matter)</summary>
              <pre className="max-h-96 overflow-auto border-t border-border px-4 py-3 font-mono text-[12.5px] leading-5">{tokens}</pre>
            </details>
          )}
          <div className="md-preview design-doc" dangerouslySetInnerHTML={{ __html: v.html }} />
        </article>
      </div>
    </div>
  );
}

/** Copy / download / raw for one design file. The raw file is a static asset, fetched on demand. */
export function FileActions({ id, file, primary = false }: { id: string; file: string; primary?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  const href = designFileHref(id, file);
  const fetchHref = cdnFetchPath(`design-md/files/${id}/${file}`);
  const btn = "inline-flex items-center rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium hover:border-accent hover:text-accent";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={primary ? "inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-surface hover:opacity-90" : btn}
        onClick={async () => {
          try {
            const text = await fetch(fetchHref).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
            setState((await copyText(text)) ? "copied" : "error");
          } catch {
            setState("error");
          }
          setTimeout(() => setState("idle"), 1600);
        }}
      >
        {state === "copied" ? "Copied ✓" : state === "error" ? "Copy failed" : `Copy ${file}`}
      </button>
      <a
        href={href}
        download={file}
        className={btn}
        onClick={async (e) => {
          // Browsers ignore `download` on a cross-origin (CDN) link, so save it from a blob instead.
          e.preventDefault();
          try {
            const blob = await fetch(fetchHref).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)));
            const url = URL.createObjectURL(blob);
            Object.assign(document.createElement("a"), { href: url, download: file }).click();
            URL.revokeObjectURL(url);
          } catch {
            window.open(href, "_blank", "noopener");
          }
        }}
      >
        Download
      </a>
      <a href={href} target="_blank" rel="noopener" className={btn}>
        Raw
      </a>
      <OpenInAssistant href={href} file={file} btn={btn} />
    </div>
  );
}

const svg = { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": true } as const;

const OpenAIIcon = () => (
  <svg {...svg} fill="currentColor">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

const ClaudeIcon = () => (
  <svg {...svg} stroke="#D97757" strokeWidth="2.4" strokeLinecap="round">
    {Array.from({ length: 10 }, (_, i) => (
      <line key={i} x1="12" y1="12" x2="12" y2={i % 2 ? 3.8 : 2.2} transform={`rotate(${i * 36} 12 12)`} />
    ))}
  </svg>
);

const GeminiIcon = () => (
  <svg {...svg}>
    <defs>
      <linearGradient id="gemini-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4285F4" />
        <stop offset="0.55" stopColor="#9B72CB" />
        <stop offset="1" stopColor="#D96570" />
      </linearGradient>
    </defs>
    <path fill="url(#gemini-grad)" d="M12 0C12 6.6 17.4 12 24 12C17.4 12 12 17.4 12 24C12 17.4 6.6 12 0 12C6.6 12 12 6.6 12 0Z" />
  </svg>
);

const PerplexityIcon = () => (
  <svg {...svg} fill="#20B8CD">
    <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
  </svg>
);

const CopilotIcon = () => (
  <svg {...svg} fill="currentColor">
    <path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" />
  </svg>
);

const CursorIcon = () => (
  <svg {...svg} fill="currentColor">
    <path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23" />
  </svg>
);

const GrokIcon = () => (
  <svg {...svg} fill="currentColor">
    <path d="M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 1.75-8.009.036-.05.072-.099.107-.149l-2.097 2.095v-.01L9.269 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815" />
  </svg>
);

const MistralIcon = () => (
  <svg {...svg} fill="#FA520F">
    <path d="M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z" />
  </svg>
);

const assistants = [
  { name: "OpenAI", hint: "ChatGPT", Icon: OpenAIIcon, url: (q: string) => `https://chatgpt.com/?q=${q}` },
  { name: "Claude", hint: "Claude.ai", Icon: ClaudeIcon, url: (q: string) => `https://claude.ai/new?q=${q}` },
  { name: "Gemini", hint: "Google Gemini", Icon: GeminiIcon, url: (q: string) => `https://gemini.google.com/app?q=${q}` },
  { name: "Perplexity", hint: "Perplexity AI", Icon: PerplexityIcon, url: (q: string) => `https://www.perplexity.ai/search?q=${q}` },
  { name: "Copilot", hint: "Microsoft Copilot", Icon: CopilotIcon, url: (q: string) => `https://copilot.microsoft.com/?q=${q}` },
  { name: "Grok", hint: "xAI Grok", Icon: GrokIcon, url: (q: string) => `https://grok.com/?q=${q}` },
  { name: "Mistral", hint: "Le Chat", Icon: MistralIcon, url: (q: string) => `https://chat.mistral.ai/chat?q=${q}` },
  { name: "Cursor", hint: "Cursor editor", Icon: CursorIcon, url: (q: string) => `https://cursor.com/link/prompt?text=${q}` },
];

/** Dropdown that hands the raw file's URL to an AI assistant, plus a link to the raw markdown. */
function OpenInAssistant({ href, file, btn }: { href: string; file: string; btn: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === "keydown" ? (e as KeyboardEvent).key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm hover:bg-background";
  const q = () => encodeURIComponent(`Read ${new URL(href, location.href).href} and follow it as the design system (${file}) for all UI work: colors, type, spacing and components.`);

  return (
    <div ref={ref} className="relative">
      <button type="button" className={`${btn} gap-2`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span aria-hidden className="text-accent">✦</span>
        Open in AI assistant
        <svg aria-hidden viewBox="0 0 12 12" width="10" height="10" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-xl">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Send {file} to</p>
          {assistants.map(({ name, hint, Icon, url }) => (
            <a
              key={name}
              role="menuitem"
              href="#"
              className={item}
              onClick={(e) => {
                e.preventDefault();
                window.open(url(q()), "_blank", "noopener");
                setOpen(false);
              }}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                <Icon />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block font-medium">Open in {name}</span>
                <span className="block text-xs text-muted">{hint}</span>
              </span>
              <span aria-hidden className="text-muted">↗</span>
            </a>
          ))}
          <div className="my-1 border-t border-border" />
          <a role="menuitem" href={href} target="_blank" rel="noopener" className={item} onClick={() => setOpen(false)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-xs font-semibold">MD</span>
            <span className="flex-1 font-medium">View raw markdown</span>
            <span aria-hidden className="text-muted">↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
