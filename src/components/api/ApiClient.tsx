"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CodeEditor, type EditorLanguage } from "@/components/json/CodeEditor";
import { copyText } from "@/components/quickref/Snippet";
import {
  BODY_TYPES,
  bodyless,
  displayUrl,
  emptyAuth,
  isForbiddenHeader,
  kv,
  METHODS,
  newRequest,
  parseCurl,
  resolve,
  snippet,
  SNIPPET_LANGS,
  splitUrl,
  substitute,
  unresolved,
  type ApiRequest,
  type AuthType,
  type BodyMode,
  type KV,
  type Method,
  type SnippetLang,
} from "@/lib/api/request";
import { KeyValueEditor } from "./KeyValueEditor";

const STORAGE_KEY = "coderef:api-client";
const MAX_HISTORY = 50;
/** Bodies larger than this are shown truncated (the download has everything). */
const MAX_SHOWN = 2_000_000;

type HistoryItem = { id: string; at: number; status: number | null; request: ApiRequest };
type Saved = { current?: ApiRequest; history?: HistoryItem[]; saved?: ApiRequest[]; vars?: KV[] };

type ApiResponse =
  | {
      kind: "ok";
      status: number;
      statusText: string;
      time: number;
      size: number;
      url: string;
      redirected: boolean;
      headers: [string, string][];
      contentType: string;
      text: string;
      truncated: boolean;
      blob: Blob;
      /** Object URL for images and PDFs. */
      mediaUrl: string | null;
    }
  | { kind: "error"; time: number; message: string; reasons: string[] };

const btn =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-40";
const btnPrimary = "inline-flex h-10 items-center gap-1.5 rounded-lg bg-accent px-5 text-sm font-semibold text-surface transition-opacity hover:opacity-90";
const field = "h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-[13px] outline-none focus:border-accent";

export const METHOD_COLOR: Record<Method, string> = {
  GET: "text-emerald-600 dark:text-emerald-400",
  POST: "text-amber-600 dark:text-amber-400",
  PUT: "text-sky-600 dark:text-sky-400",
  PATCH: "text-violet-600 dark:text-violet-400",
  DELETE: "text-rose-600 dark:text-rose-400",
  HEAD: "text-teal-600 dark:text-teal-400",
  OPTIONS: "text-fuchsia-600 dark:text-fuchsia-400",
};

const statusColor = (s: number) =>
  s < 300 ? "text-emerald-600 dark:text-emerald-400" : s < 400 ? "text-sky-600 dark:text-sky-400" : s < 500 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400";

const formatSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 ** 2 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 ** 2).toFixed(2)} MB`);

const SAMPLES: { label: string; request: Partial<ApiRequest> }[] = [
  { label: "GET a post", request: { method: "GET", url: "{{baseUrl}}/posts/1" } },
  { label: "GET with query params", request: { method: "GET", url: "{{baseUrl}}/comments", params: [kv("postId", "1")] } },
  {
    label: "POST JSON",
    request: { method: "POST", url: "{{baseUrl}}/posts", bodyMode: "json", body: '{\n  "title": "Hello",\n  "body": "Created from coderef",\n  "userId": 1\n}' },
  },
  { label: "PUT (replace)", request: { method: "PUT", url: "{{baseUrl}}/posts/1", bodyMode: "json", body: '{\n  "id": 1,\n  "title": "Updated",\n  "body": "New body",\n  "userId": 1\n}' } },
  { label: "PATCH (update)", request: { method: "PATCH", url: "{{baseUrl}}/posts/1", bodyMode: "json", body: '{\n  "title": "Patched title"\n}' } },
  { label: "DELETE", request: { method: "DELETE", url: "{{baseUrl}}/posts/1" } },
  { label: "GitHub user", request: { method: "GET", url: "https://api.github.com/users/octocat", headers: [kv("Accept", "application/vnd.github+json")] } },
  {
    label: "Echo: headers, auth & form",
    request: {
      method: "POST",
      url: "https://httpbin.org/anything",
      headers: [kv("X-Demo", "coderef")],
      bodyMode: "form",
      form: [kv("name", "Ada"), kv("lang", "en")],
      auth: { ...emptyAuth(), type: "bearer", token: "{{token}}" },
    },
  },
  { label: "Image response", request: { method: "GET", url: "https://httpbin.org/image/png" } },
];

const DEFAULT_VARS = () => [kv("baseUrl", "https://jsonplaceholder.typicode.com"), kv("token", "my-secret-token")];
const sample = (i: number) => newRequest({ ...SAMPLES[i].request, params: SAMPLES[i].request.params?.map((p) => ({ ...p })) ?? [] });

function load(): Saved {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Saved;
  } catch {
    return {};
  }
}

const languageOf = (type: string): EditorLanguage =>
  /json/.test(type) ? "json" : /html/.test(type) ? "html" : /xml|svg/.test(type) ? "xml" : /javascript|ecmascript/.test(type) ? "javascript" : /css/.test(type) ? "css" : "text";

function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: [T, ReactNode][]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap gap-1">
      {tabs.map(([id, text]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={value === id}
          onClick={() => onChange(id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-sm transition-colors ${
            value === id ? "bg-chip font-medium text-foreground" : "text-muted hover:bg-chip hover:text-foreground"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

const Count = ({ n }: { n: number }) => (n ? <span className="rounded-full bg-accent/15 px-1.5 text-xs text-accent">{n}</span> : null);

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="flex size-8 items-center justify-center rounded-md text-muted hover:bg-chip" aria-label="Close">
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function ApiClient({ heading }: { heading: ReactNode }) {
  const [req, setReq] = useState<ApiRequest>(() => sample(0));
  const [vars, setVars] = useState<KV[]>(DEFAULT_VARS);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [saved, setSaved] = useState<ApiRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [reqTab, setReqTab] = useState<"params" | "headers" | "body" | "auth">("params");
  const [resTab, setResTab] = useState<"body" | "headers">("body");
  const [bodyView, setBodyView] = useState<"pretty" | "raw" | "preview">("pretty");
  const [side, setSide] = useState<"history" | "saved" | "vars">("history");

  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [sending, setSending] = useState(false);
  const abort = useRef<AbortController | null>(null);

  const [modal, setModal] = useState<"code" | "import" | null>(null);
  const [codeLang, setCodeLang] = useState<SnippetLang>("curl");
  const [curlText, setCurlText] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (text: string) => {
    setNotice(text);
    setTimeout(() => setNotice(null), 1800);
  };

  // Restore the last session.
  useEffect(() => {
    const s = load();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time restore from localStorage */
    if (s.current) setReq({ ...newRequest(), ...s.current, auth: { ...emptyAuth(), ...s.current.auth } });
    if (s.vars) setVars(s.vars);
    if (s.history) setHistory(s.history);
    if (s.saved) setSaved(s.saved);
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ current: req, vars, history, saved } satisfies Saved));
      } catch {
        // Storage full or blocked: keep working without it.
      }
    }, 400);
    return () => clearTimeout(id);
  }, [req, vars, history, saved, loaded]);

  // Free object URLs from earlier responses.
  useEffect(() => {
    const url = response?.kind === "ok" ? response.mediaUrl : null;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [response]);

  const patch = (p: Partial<ApiRequest>) => setReq((r) => ({ ...r, ...p }));
  const resolved = useMemo(() => resolve(req, vars), [req, vars]);
  const missing = useMemo(
    () => unresolved([req.url, ...req.params.map((p) => p.key + p.value), ...req.headers.map((h) => h.key + h.value), req.body, req.auth.token].join(" ")).filter(
      (name) => !vars.some((v) => v.enabled && v.key.trim() === name),
    ),
    [req, vars],
  );

  const send = useCallback(async () => {
    const r = resolve(req, vars);
    if (!r.url) return;
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setSending(true);
    const started = performance.now();
    const snapshot = structuredClone(req);
    try {
      let body: BodyInit | undefined;
      if (r.multipart) {
        const form = new FormData();
        r.multipart.forEach(([k, v]) => form.append(k, v));
        body = form;
      } else if (r.body !== null) body = r.body;
      const res = await fetch(r.url, { method: r.method, headers: r.headers, body, signal: controller.signal, redirect: "follow" });
      const blob = await res.blob();
      const time = Math.round(performance.now() - started);
      const contentType = res.headers.get("content-type") ?? "";
      const media = /^(image|audio|video)\/|application\/pdf/.test(contentType);
      const text = media ? "" : await blob.slice(0, MAX_SHOWN).text();
      setResponse({
        kind: "ok",
        status: res.status,
        statusText: res.statusText,
        time,
        size: blob.size,
        url: res.url,
        redirected: res.redirected,
        headers: [...res.headers.entries()],
        contentType,
        text,
        truncated: !media && blob.size > MAX_SHOWN,
        blob,
        mediaUrl: media ? URL.createObjectURL(blob) : null,
      });
      setBodyView(media || /html/.test(contentType) ? "preview" : "pretty");
      setHistory((h) => [{ id: snapshot.id + Date.now(), at: Date.now(), status: res.status, request: snapshot }, ...h].slice(0, MAX_HISTORY));
    } catch (err) {
      const time = Math.round(performance.now() - started);
      if ((err as Error).name === "AbortError") {
        setResponse({ kind: "error", time, message: "Request cancelled.", reasons: [] });
        return;
      }
      const reasons: string[] = [];
      if (location.protocol === "https:" && r.url.startsWith("http:"))
        reasons.push("Mixed content: this page is HTTPS, so browsers block requests to plain http:// URLs. Use https:// or run the cURL command instead.");
      reasons.push(
        "CORS: the server didn't allow requests from this website (no Access-Control-Allow-Origin header). Browsers enforce this; Postman and cURL don't. Public APIs built for browsers allow it; many private ones don't.",
        "The server is unreachable — a typo in the host, no internet connection, or an invalid TLS certificate.",
      );
      setResponse({ kind: "error", time, message: (err as Error).message || "The request failed.", reasons });
      setHistory((h) => [{ id: snapshot.id + Date.now(), at: Date.now(), status: null, request: snapshot }, ...h].slice(0, MAX_HISTORY));
    } finally {
      if (abort.current === controller) abort.current = null;
      setSending(false);
    }
  }, [req, vars]);

  const openRequest = (r: ApiRequest) => {
    setReq(structuredClone(r));
    setResponse(null);
  };

  const save = () => {
    const name = prompt("Save request as:", req.name || `${req.method} ${displayUrl(req)}`);
    if (!name) return;
    const next = { ...req, name };
    setReq(next);
    setSaved((s) => (s.some((x) => x.id === next.id) ? s.map((x) => (x.id === next.id ? structuredClone(next) : x)) : [structuredClone(next), ...s]));
    setSide("saved");
    flash("Saved");
  };

  const importCurl = () => {
    try {
      openRequest(parseCurl(curlText));
      setModal(null);
      setCurlText("");
      setCurlError(null);
    } catch (err) {
      setCurlError((err as Error).message);
    }
  };

  const onUrl = (text: string) => setReq((r) => ({ ...r, ...splitUrl(text, r.params) }));

  const setBodyMode = (mode: BodyMode) => {
    if (mode !== "none" && bodyless(req.method)) patch({ bodyMode: mode, method: "POST" });
    else patch({ bodyMode: mode });
  };

  const auth = req.auth;
  const setAuth = (p: Partial<typeof auth>) => patch({ auth: { ...auth, ...p } });

  const autoHeaders = resolved.headers.filter(([k]) => !req.headers.some((h) => h.enabled && substitute(h.key, vars).trim().toLowerCase() === k.toLowerCase()));

  const prettyText = useMemo(() => {
    if (response?.kind !== "ok") return "";
    if (/json/.test(response.contentType) || /^\s*[[{]/.test(response.text)) {
      try {
        return JSON.stringify(JSON.parse(response.text), null, 2);
      } catch {
        // Not valid JSON after all; show as is.
      }
    }
    return response.text;
  }, [response]);

  const downloadBody = () => {
    if (response?.kind !== "ok") return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(response.blob);
    const ext = /json/.test(response.contentType) ? "json" : /html/.test(response.contentType) ? "html" : /xml/.test(response.contentType) ? "xml" : (response.contentType.split("/")[1]?.split(/[;+]/)[0] ?? "txt");
    a.download = `response.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div
      className="flex flex-col gap-2.5 px-3 py-3 sm:px-4 lg:h-[calc(100dvh-3.5rem)]"
      onKeyDown={(e) => {
        // The body editor handles its own Ctrl/⌘+Enter (and marks the event handled).
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !e.defaultPrevented) {
          e.preventDefault();
          send();
        }
      }}
    >
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {heading}
        <select
          aria-label="Load a sample request"
          value=""
          onChange={(e) => {
            const i = Number(e.target.value);
            openRequest(sample(i));
            // Samples rely on these variables.
            setVars((v) => [...v, ...DEFAULT_VARS().filter((d) => !v.some((x) => x.key === d.key))]);
          }}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm"
        >
          <option value="" disabled>
            Samples…
          </option>
          {SAMPLES.map((s, i) => (
            <option key={s.label} value={i}>
              {s.request.method} · {s.label}
            </option>
          ))}
        </select>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {notice && (
            <span role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
              {notice}
            </span>
          )}
          <button type="button" className={btn} onClick={() => openRequest(newRequest())}>
            + New
          </button>
          <button type="button" className={btn} onClick={() => setModal("import")}>
            Import cURL
          </button>
          <button type="button" className={btn} onClick={() => setModal("code")} disabled={!resolved.url}>
            {"</>"} Code
          </button>
          <button type="button" className={btn} onClick={save}>
            Save
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 lg:flex-row">
        {/* Sidebar */}
        <aside className="order-last flex h-80 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:order-first lg:h-auto lg:w-72">
          <div className="shrink-0 border-b border-border px-2 py-1.5">
            <Tabs
              label="Sidebar"
              value={side}
              onChange={setSide}
              tabs={[
                ["history", "History"],
                ["saved", <>Saved <Count n={saved.length} /></>],
                ["vars", <>Variables <Count n={vars.filter((v) => v.enabled && v.key).length} /></>],
              ]}
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {side === "vars" ? (
              <div>
                <p className="px-3 py-2 text-xs text-muted">
                  Use <code className="font-mono">{"{{name}}"}</code> in the URL, params, headers, body or auth.
                </p>
                <KeyValueEditor rows={vars} onChange={setVars} keyPlaceholder="Variable" valuePlaceholder="Value" />
              </div>
            ) : (
              <RequestList
                items={side === "history" ? history.map((h) => ({ id: h.id, request: h.request, status: h.status, at: h.at })) : saved.map((s) => ({ id: s.id, request: s, status: undefined, at: undefined }))}
                empty={side === "history" ? "Requests you send appear here." : "Press Save to keep a request here."}
                activeId={req.id}
                onOpen={openRequest}
                onRemove={(id) => (side === "history" ? setHistory((h) => h.filter((x) => x.id !== id)) : setSaved((s) => s.filter((x) => x.id !== id)))}
                onClear={side === "history" && history.length ? () => setHistory([]) : undefined}
              />
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2.5">
          {/* Request line */}
          <form
            className="flex shrink-0 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div className="flex min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface focus-within:border-accent">
              <select
                aria-label="Method"
                value={req.method}
                onChange={(e) => {
                  const method = e.target.value as Method;
                  patch({ method, bodyMode: bodyless(method) ? "none" : req.bodyMode });
                }}
                className={`h-10 shrink-0 border-r border-border bg-chip/60 px-2 font-mono text-sm font-bold outline-none ${METHOD_COLOR[req.method]}`}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m} className="text-foreground">
                    {m}
                  </option>
                ))}
              </select>
              <input
                aria-label="Request URL"
                value={displayUrl(req)}
                onChange={(e) => onUrl(e.target.value)}
                onPaste={(e) => {
                  // Pasting a whole cURL command imports it.
                  const text = e.clipboardData.getData("text");
                  if (/^\s*curl\s/.test(text)) {
                    e.preventDefault();
                    try {
                      openRequest(parseCurl(text));
                      flash("Imported cURL");
                    } catch (err) {
                      flash((err as Error).message);
                    }
                  }
                }}
                placeholder="https://api.example.com/resource   (or paste a cURL command)"
                spellCheck={false}
                className="h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] outline-none"
              />
            </div>
            {sending ? (
              <button
                type="button"
                className="inline-flex h-10 items-center rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700"
                onClick={() => abort.current?.abort()}
              >
                Cancel
              </button>
            ) : (
              <button type="submit" className={btnPrimary} disabled={!req.url.trim()} title="Send (Ctrl/⌘+Enter)">
                Send
              </button>
            )}
          </form>
          {missing.length > 0 && (
            <p className="-mt-1 shrink-0 text-xs text-amber-700 dark:text-amber-400">
              Undefined variable{missing.length > 1 ? "s" : ""}: {missing.map((m) => `{{${m}}}`).join(", ")} —{" "}
              <button type="button" className="underline" onClick={() => setSide("vars")}>
                add in Variables
              </button>
            </p>
          )}

          <div className="grid min-h-0 flex-1 gap-2.5 lg:grid-rows-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Request details */}
            <section className="flex h-[50vh] min-h-[260px] flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-auto lg:min-h-0">
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-2 py-1.5">
                <Tabs
                  label="Request"
                  value={reqTab}
                  onChange={setReqTab}
                  tabs={[
                    ["params", <>Params <Count n={req.params.filter((p) => p.enabled && p.key).length} /></>],
                    ["headers", <>Headers <Count n={req.headers.filter((h) => h.enabled && h.key).length} /></>],
                    ["body", <>Body {req.bodyMode !== "none" && <span className="size-1.5 rounded-full bg-accent" />}</>],
                    ["auth", <>Auth {auth.type !== "none" && <span className="size-1.5 rounded-full bg-accent" />}</>],
                  ]}
                />
                {reqTab === "body" && (req.bodyMode === "json") && (
                  <button
                    type="button"
                    className="ml-auto text-xs text-muted hover:text-foreground"
                    onClick={() => {
                      try {
                        patch({ body: JSON.stringify(JSON.parse(req.body), null, 2) });
                      } catch (err) {
                        flash(`Invalid JSON: ${(err as Error).message}`);
                      }
                    }}
                  >
                    Beautify
                  </button>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-auto">
                {reqTab === "params" && (
                  <KeyValueEditor rows={req.params} onChange={(params) => patch({ params })} keyPlaceholder="Query parameter" />
                )}

                {reqTab === "headers" && (
                  <>
                    <KeyValueEditor
                      rows={req.headers}
                      onChange={(headers) => patch({ headers })}
                      keyPlaceholder="Header"
                      warn={(h) => (h.enabled && isForbiddenHeader(substitute(h.key, vars)) ? "Browsers don't let web pages set this header; it won't be sent." : null)}
                    />
                    {autoHeaders.length > 0 && (
                      <div className="px-3 py-2 text-xs text-muted">
                        <p className="mb-1 font-medium">Added automatically</p>
                        {autoHeaders.map(([k, v]) => (
                          <p key={k} className="font-mono">
                            {k}: {k.toLowerCase() === "authorization" ? v.replace(/(\S+\s).+/, "$1••••••") : v}
                          </p>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {reqTab === "body" && (
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 flex-wrap gap-x-4 gap-y-1 border-b border-border px-3 py-2 text-sm">
                      {(
                        [
                          ["none", "none"],
                          ["json", "JSON"],
                          ["text", "Text"],
                          ["xml", "XML"],
                          ["form", "x-www-form-urlencoded"],
                          ["multipart", "form-data"],
                        ] as [BodyMode, string][]
                      ).map(([mode, label]) => (
                        <label key={mode} className="flex cursor-pointer items-center gap-1.5">
                          <input type="radio" name="body-mode" checked={req.bodyMode === mode} onChange={() => setBodyMode(mode)} className="accent-[var(--accent)]" />
                          {label}
                        </label>
                      ))}
                    </div>
                    {req.bodyMode === "none" ? (
                      <p className="p-4 text-sm text-muted">This request has no body.{bodyless(req.method) && ` ${req.method} requests can't have one.`}</p>
                    ) : req.bodyMode === "form" || req.bodyMode === "multipart" ? (
                      <KeyValueEditor rows={req.form} onChange={(form) => patch({ form })} keyPlaceholder="Field" />
                    ) : (
                      <div className="min-h-0 flex-1">
                        <CodeEditor
                          value={req.body}
                          onChange={(body) => patch({ body })}
                          language={req.bodyMode === "json" ? "json" : req.bodyMode === "xml" ? "xml" : "text"}
                          label="Request body"
                          placeholder={req.bodyMode === "json" ? '{ "key": "value" }' : ""}
                          onSubmit={send}
                        />
                      </div>
                    )}
                    {req.bodyMode !== "none" && req.bodyMode !== "multipart" && (
                      <p className="shrink-0 border-t border-border px-3 py-1 text-xs text-muted">
                        Content-Type: {req.headers.find((h) => h.enabled && h.key.toLowerCase() === "content-type")?.value || BODY_TYPES[req.bodyMode]}
                      </p>
                    )}
                  </div>
                )}

                {reqTab === "auth" && (
                  <div className="grid max-w-xl gap-3 p-4 text-sm">
                    <label className="grid gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Type</span>
                      <select value={auth.type} onChange={(e) => setAuth({ type: e.target.value as AuthType })} className="h-9 rounded-lg border border-border bg-background px-2">
                        <option value="none">No auth</option>
                        <option value="bearer">Bearer token</option>
                        <option value="basic">Basic auth</option>
                        <option value="apikey">API key</option>
                      </select>
                    </label>
                    {auth.type === "bearer" && (
                      <label className="grid gap-1">
                        <span className="text-xs text-muted">Token</span>
                        <input className={field} value={auth.token} onChange={(e) => setAuth({ token: e.target.value })} placeholder="{{token}}" />
                      </label>
                    )}
                    {auth.type === "basic" && (
                      <>
                        <label className="grid gap-1">
                          <span className="text-xs text-muted">Username</span>
                          <input className={field} value={auth.username} onChange={(e) => setAuth({ username: e.target.value })} autoComplete="off" />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-muted">Password</span>
                          <input className={field} type="password" value={auth.password} onChange={(e) => setAuth({ password: e.target.value })} autoComplete="new-password" />
                        </label>
                      </>
                    )}
                    {auth.type === "apikey" && (
                      <>
                        <label className="grid gap-1">
                          <span className="text-xs text-muted">Key</span>
                          <input className={field} value={auth.key} onChange={(e) => setAuth({ key: e.target.value })} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-muted">Value</span>
                          <input className={field} value={auth.value} onChange={(e) => setAuth({ value: e.target.value })} />
                        </label>
                        <label className="grid gap-1">
                          <span className="text-xs text-muted">Add to</span>
                          <select value={auth.in} onChange={(e) => setAuth({ in: e.target.value as "header" | "query" })} className="h-9 rounded-lg border border-border bg-background px-2">
                            <option value="header">Header</option>
                            <option value="query">Query params</option>
                          </select>
                        </label>
                      </>
                    )}
                    {auth.type !== "none" && (
                      <p className="text-xs text-muted">Saved only in this browser. Use a variable like {"{{token}}"} to keep secrets out of shared snippets.</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Response */}
            <section className="flex h-[60vh] min-h-[300px] flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-auto lg:min-h-0">
              <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-2 py-1.5">
                {response?.kind === "ok" ? (
                  <Tabs
                    label="Response"
                    value={resTab}
                    onChange={setResTab}
                    tabs={[
                      ["body", "Body"],
                      ["headers", <>Headers <Count n={response.headers.length} /></>],
                    ]}
                  />
                ) : (
                  <span className="px-1 py-1 text-sm font-medium">Response</span>
                )}
                {response?.kind === "ok" && (
                  <div className="ml-auto flex flex-wrap items-center gap-3 pr-1 text-xs">
                    <span className={`font-mono font-semibold ${statusColor(response.status)}`}>
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-muted">{response.time} ms</span>
                    <span className="text-muted">{formatSize(response.size)}</span>
                  </div>
                )}
                {response?.kind === "error" && <span className="ml-auto pr-1 text-xs text-muted">{response.time} ms</span>}
              </div>

              <div className="relative min-h-0 flex-1 overflow-auto">
                {sending && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/70 text-sm text-muted">
                    <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-border border-t-accent" />
                    Sending…
                  </div>
                )}
                {!response && !sending && (
                  <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center text-sm text-muted">
                    <p>Enter a URL and press <strong className="text-foreground">Send</strong> to see the response.</p>
                    <p className="text-xs">Try one of the Samples, or paste a cURL command into the URL bar.</p>
                  </div>
                )}

                {response?.kind === "error" && (
                  <div className="p-4 text-sm">
                    <p className="font-semibold text-rose-700 dark:text-rose-400">Could not get a response</p>
                    <p className="mt-1 font-mono text-xs text-muted">{response.message}</p>
                    {response.reasons.length > 0 && (
                      <>
                        <p className="mt-4 font-medium">Common causes</p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
                          {response.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                        <button
                          type="button"
                          className={`${btn} mt-4`}
                          onClick={async () => flash((await copyText(snippet(resolved, "curl"))) ? "cURL copied — run it in a terminal" : "Couldn't copy")}
                        >
                          Copy as cURL
                        </button>
                      </>
                    )}
                  </div>
                )}

                {response?.kind === "ok" && resTab === "headers" && (
                  <div>
                    <table className="w-full text-sm">
                      <tbody>
                        {response.headers.map(([k, v]) => (
                          <tr key={k} className="border-b border-border/60 align-top">
                            <td className="w-1/3 px-3 py-1.5 font-mono text-[12.5px] font-medium">{k}</td>
                            <td className="break-all px-3 py-1.5 font-mono text-[12.5px] text-muted">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="px-3 py-2 text-xs text-muted">
                      Browsers only show the headers a server exposes to web pages (Access-Control-Expose-Headers). Cookies set by the response are never visible here.
                    </p>
                  </div>
                )}

                {response?.kind === "ok" && resTab === "body" && (
                  <div className="flex h-full flex-col">
                    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-2 py-1">
                      <Tabs
                        label="Body view"
                        value={bodyView}
                        onChange={setBodyView}
                        tabs={[
                          ["pretty", "Pretty"],
                          ["raw", "Raw"],
                          ["preview", "Preview"],
                        ]}
                      />
                      <span className="text-xs text-muted">{response.contentType || "no content type"}</span>
                      {response.redirected && <span className="text-xs text-muted">· redirected to {response.url}</span>}
                      <span className="ml-auto flex gap-3 pr-1 text-xs">
                        {!response.mediaUrl && (
                          <button
                            type="button"
                            className="text-muted hover:text-foreground"
                            onClick={async () => flash((await copyText(bodyView === "pretty" ? prettyText : response.text)) ? "Copied" : "Couldn't copy")}
                          >
                            Copy
                          </button>
                        )}
                        <button type="button" className="text-muted hover:text-foreground" onClick={downloadBody}>
                          Download
                        </button>
                      </span>
                    </div>
                    {response.truncated && (
                      <p className="shrink-0 bg-amber-500/10 px-3 py-1 text-xs text-amber-800 dark:text-amber-300">
                        Showing the first {formatSize(MAX_SHOWN)} of {formatSize(response.size)}. Download for the full body.
                      </p>
                    )}
                    <div className="relative min-h-0 flex-1">
                      {bodyView === "preview" ? (
                        response.mediaUrl ? (
                          /^image\//.test(response.contentType) ? (
                            // eslint-disable-next-line @next/next/no-img-element -- a blob: URL from the response
                            <img src={response.mediaUrl} alt="Response image" className="m-4 max-h-[calc(100%-2rem)] max-w-[calc(100%-2rem)] object-contain" />
                          ) : (
                            <iframe title="Response preview" src={response.mediaUrl} className="absolute inset-0 size-full border-0" />
                          )
                        ) : (
                          // No scripts: an API's HTML is shown, not run.
                          <iframe title="Response preview" sandbox="" srcDoc={response.text} className="absolute inset-0 size-full border-0 bg-white" />
                        )
                      ) : response.mediaUrl ? (
                        <p className="p-4 text-sm text-muted">Binary response ({response.contentType}). See Preview, or Download it.</p>
                      ) : response.size === 0 ? (
                        <p className="p-4 text-sm text-muted">The response has no body.</p>
                      ) : (
                        <div className="absolute inset-0">
                          <CodeEditor
                            value={bodyView === "pretty" ? prettyText : response.text}
                            readOnly
                            language={bodyView === "pretty" ? languageOf(response.contentType || (prettyText !== response.text ? "json" : "")) : "text"}
                            label="Response body"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {modal === "code" && (
        <Modal title="Code snippet" onClose={() => setModal(null)}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <select value={codeLang} onChange={(e) => setCodeLang(e.target.value as SnippetLang)} aria-label="Language" className="h-9 rounded-lg border border-border bg-background px-2 text-sm">
              {Object.entries(SNIPPET_LANGS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <button type="button" className={`${btn} ml-auto`} onClick={async () => flash((await copyText(snippet(resolved, codeLang))) ? "Copied" : "Couldn't copy")}>
              Copy
            </button>
          </div>
          <pre className="overflow-x-auto rounded-lg bg-background p-3 font-mono text-[12.5px] leading-5">{snippet(resolved, codeLang)}</pre>
          <p className="mt-2 text-xs text-muted">Variables are filled in with their current values.</p>
        </Modal>
      )}

      {modal === "import" && (
        <Modal title="Import cURL" onClose={() => setModal(null)}>
          <p className="mb-2 text-sm text-muted">
            Paste a cURL command — for example from your browser&apos;s DevTools (Network → right-click → Copy as cURL) or an API&apos;s docs.
          </p>
          <textarea
            autoFocus
            value={curlText}
            onChange={(e) => setCurlText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={`curl -X POST https://api.example.com/items \\\n  -H 'Content-Type: application/json' \\\n  -d '{"name": "Ada"}'`}
            className="w-full rounded-lg border border-border bg-background p-3 font-mono text-[12.5px] outline-none focus:border-accent"
          />
          {curlError && <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">{curlError}</p>}
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className={btn} onClick={() => setModal(null)}>
              Cancel
            </button>
            <button type="button" className={btnPrimary} onClick={importCurl} disabled={!curlText.trim()}>
              Import
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function RequestList({
  items,
  empty,
  activeId,
  onOpen,
  onRemove,
  onClear,
}: {
  items: { id: string; request: ApiRequest; status: number | null | undefined; at: number | undefined }[];
  empty: string;
  activeId: string;
  onOpen: (r: ApiRequest) => void;
  onRemove: (id: string) => void;
  onClear?: () => void;
}) {
  if (!items.length) return <p className="px-3 py-4 text-sm text-muted">{empty}</p>;
  return (
    <>
      <ul className="divide-y divide-border/60">
        {items.map(({ id, request: r, status, at }) => (
          <li key={id} className={`group flex items-start gap-1 px-2 py-1.5 hover:bg-chip ${r.id === activeId && status === undefined ? "bg-accent/10" : ""}`}>
            <button type="button" onClick={() => onOpen(r)} className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-2">
                <span className={`w-12 shrink-0 font-mono text-[11px] font-bold ${METHOD_COLOR[r.method]}`}>{r.method}</span>
                <span className="truncate text-[13px]">{r.name || displayUrl(r).replace(/^https?:\/\//, "") || "Untitled"}</span>
              </span>
              {(status !== undefined || at) && (
                <span className="ml-14 flex gap-2 text-[11px] text-muted">
                  {status !== undefined && <span className={status ? statusColor(status) : "text-rose-600 dark:text-rose-400"}>{status ?? "failed"}</span>}
                  {at && <span>{new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onRemove(id)}
              className="flex size-6 shrink-0 items-center justify-center rounded text-muted opacity-0 hover:bg-surface hover:text-foreground focus:opacity-100 group-hover:opacity-100"
              aria-label="Remove"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      {onClear && (
        <button type="button" onClick={onClear} className="w-full px-3 py-2 text-left text-xs text-muted hover:text-foreground">
          Clear history
        </button>
      )}
    </>
  );
}
