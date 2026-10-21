// REST client model: a request as edited in the UI, turned into a fetch() call, code snippets, or read back from cURL.

export const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"] as const;
export type Method = (typeof METHODS)[number];

export type KV = { id: string; key: string; value: string; enabled: boolean };
export type BodyMode = "none" | "json" | "text" | "xml" | "form" | "multipart";
export type AuthType = "none" | "bearer" | "basic" | "apikey";
export type Auth = { type: AuthType; token: string; username: string; password: string; key: string; value: string; in: "header" | "query" };

export type ApiRequest = {
  id: string;
  name: string;
  method: Method;
  /** URL without the query string; the query lives in `params`. */
  url: string;
  params: KV[];
  headers: KV[];
  bodyMode: BodyMode;
  body: string;
  form: KV[];
  auth: Auth;
};

export const uid = () => Math.random().toString(36).slice(2, 10);
export const kv = (key = "", value = "", enabled = true): KV => ({ id: uid(), key, value, enabled });

export const emptyAuth = (): Auth => ({ type: "none", token: "", username: "", password: "", key: "X-API-Key", value: "", in: "header" });

export const newRequest = (patch: Partial<ApiRequest> = {}): ApiRequest => ({
  id: uid(),
  name: "",
  method: "GET",
  url: "",
  params: [],
  headers: [],
  bodyMode: "none",
  body: "",
  form: [],
  auth: emptyAuth(),
  ...patch,
});

export const BODY_TYPES: Record<Exclude<BodyMode, "none" | "multipart">, string> = {
  json: "application/json",
  text: "text/plain",
  xml: "application/xml",
  form: "application/x-www-form-urlencoded",
};

/** Methods that normally carry no body (fetch() refuses one on GET and HEAD). */
export const bodyless = (m: Method) => m === "GET" || m === "HEAD";

// --- URL <-> params -------------------------------------------------------------------------------

/**
 * Splits a typed URL into its base and query rows; disabled rows are kept, enabled ones replaced.
 * Rows hold the text exactly as typed (no decoding), so the URL bar never changes under the cursor.
 */
export function splitUrl(full: string, previous: KV[]): { url: string; params: KV[] } {
  const hashAt = full.indexOf("#");
  const noHash = hashAt === -1 ? full : full.slice(0, hashAt);
  const q = noHash.indexOf("?");
  if (q === -1) return { url: full, params: previous.filter((p) => !p.enabled) };
  const parsed = noHash
    .slice(q + 1)
    .split("&")
    .filter((part) => part !== "")
    .map((part) => {
      const eq = part.indexOf("=");
      const key = eq === -1 ? part : part.slice(0, eq);
      const value = eq === -1 ? "" : part.slice(eq + 1);
      return { key, value };
    });
  // Reuse row ids so the Params table doesn't remount while typing in the URL bar.
  const enabledPrev = previous.filter((p) => p.enabled);
  const rows = parsed.map((p, i) => ({ ...(enabledPrev[i] ?? kv()), key: p.key, value: p.value, enabled: true }));
  return { url: noHash.slice(0, q), params: [...rows, ...previous.filter((p) => !p.enabled)] };
}

/** Encodes what must be encoded but leaves {{variables}} and existing %XX escapes alone. */
const encodePart = (s: string) => s.replace(/\{\{[^}]*\}\}|%[0-9a-f]{2}|[^A-Za-z0-9\-._~!$'()*,;:@/?]/gi, (m) => (m.length > 1 ? m : encodeURIComponent(m)));

const queryString = (params: KV[]) =>
  params
    .filter((p) => p.enabled && p.key)
    .map((p) => (p.value === "" ? encodePart(p.key) : `${encodePart(p.key)}=${encodePart(p.value)}`))
    .join("&");

/** The URL as shown in the address bar: rows as typed, escaping only what would split them. */
export function displayUrl(req: Pick<ApiRequest, "url" | "params">) {
  const esc = (t: string, extra: string) => t.replace(new RegExp(`[&#${extra}]`, "g"), encodeURIComponent);
  const q = req.params
    .filter((p) => p.enabled && p.key)
    .map((p) => (p.value === "" ? esc(p.key, "=") : `${esc(p.key, "=")}=${esc(p.value, "")}`))
    .join("&");
  return q ? `${req.url}?${q}` : req.url;
}

// --- Variables ------------------------------------------------------------------------------------

/** Replaces {{name}} with the variable's value; unknown names are left as they are. */
export function substitute(text: string, vars: KV[]) {
  if (!text.includes("{{")) return text;
  const map = new Map(vars.filter((v) => v.enabled && v.key).map((v) => [v.key.trim(), v.value]));
  return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (m, name: string) => map.get(name) ?? m);
}

export const unresolved = (text: string) => [...new Set([...text.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)].map((m) => m[1]))];

// --- Resolve to what is actually sent ------------------------------------------------------------

export type Resolved = {
  method: Method;
  url: string;
  headers: [string, string][];
  /** Text body, or form-data fields (multipart). */
  body: string | null;
  multipart: [string, string][] | null;
};

const hasHeader = (headers: [string, string][], name: string) => headers.some(([k]) => k.toLowerCase() === name.toLowerCase());

export function resolve(req: ApiRequest, vars: KV[]): Resolved {
  const sub = (s: string) => substitute(s, vars);
  const params = req.params.map((p) => ({ ...p, key: sub(p.key), value: sub(p.value) }));
  const headers: [string, string][] = req.headers.filter((h) => h.enabled && h.key.trim()).map((h) => [sub(h.key).trim(), sub(h.value)]);

  const a = req.auth;
  if (a.type === "bearer" && a.token) headers.push(["Authorization", `Bearer ${sub(a.token)}`]);
  if (a.type === "basic" && (a.username || a.password)) headers.push(["Authorization", `Basic ${base64(`${sub(a.username)}:${sub(a.password)}`)}`]);
  if (a.type === "apikey" && a.key) {
    if (a.in === "header") headers.push([sub(a.key), sub(a.value)]);
    else params.push(kv(sub(a.key), sub(a.value)));
  }

  let url = sub(req.url).trim();
  if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = `https://${url}`;
  const q = queryString(params);
  if (q) url += (url.includes("?") ? "&" : "?") + q;

  let body: string | null = null;
  let multipart: [string, string][] | null = null;
  if (!bodyless(req.method) && req.bodyMode !== "none") {
    if (req.bodyMode === "form") {
      body = new URLSearchParams(req.form.filter((f) => f.enabled && f.key).map((f) => [sub(f.key), sub(f.value)])).toString();
    } else if (req.bodyMode === "multipart") {
      multipart = req.form.filter((f) => f.enabled && f.key).map((f) => [sub(f.key), sub(f.value)]);
    } else {
      body = sub(req.body);
    }
    // multipart/form-data gets its boundary from the browser, so it's never set by hand.
    if (req.bodyMode !== "multipart" && !hasHeader(headers, "content-type")) headers.push(["Content-Type", BODY_TYPES[req.bodyMode]]);
  }
  return { method: req.method, url, headers, body, multipart };
}

function base64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/** Headers browsers won't let a page set; fetch() silently drops them. */
export const FORBIDDEN_HEADERS = new Set([
  "accept-charset", "accept-encoding", "access-control-request-headers", "access-control-request-method", "connection", "content-length", "cookie",
  "date", "dnt", "expect", "host", "keep-alive", "origin", "referer", "te", "trailer", "transfer-encoding", "upgrade", "user-agent", "via",
]);
export const isForbiddenHeader = (name: string) => {
  const n = name.trim().toLowerCase();
  return FORBIDDEN_HEADERS.has(n) || n.startsWith("proxy-") || n.startsWith("sec-");
};

// --- Code snippets --------------------------------------------------------------------------------

export const SNIPPET_LANGS = { curl: "cURL", fetch: "JavaScript (fetch)", axios: "JavaScript (axios)", python: "Python (requests)", php: "PHP (cURL)" } as const;
export type SnippetLang = keyof typeof SNIPPET_LANGS;

const sq = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;
const js = (s: string) => JSON.stringify(s);
const py = (s: string) => JSON.stringify(s);

/** A JSON body as a code literal when it parses, so snippets read naturally. */
function jsonLiteral(body: string | null, headers: [string, string][]) {
  const type = headers.find(([k]) => k.toLowerCase() === "content-type")?.[1] ?? "";
  if (!body || !type.includes("json")) return null;
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return null;
  }
}

export function snippet(r: Resolved, lang: SnippetLang): string {
  const indent = (s: string, pad: string) => s.replace(/\n/g, `\n${pad}`);
  switch (lang) {
    case "curl": {
      const lines = [`curl -X ${r.method} ${sq(r.url)}`];
      if (r.method === "HEAD") lines[0] = `curl -I ${sq(r.url)}`;
      for (const [k, v] of r.headers) lines.push(`-H ${sq(`${k}: ${v}`)}`);
      if (r.multipart) for (const [k, v] of r.multipart) lines.push(`-F ${sq(`${k}=${v}`)}`);
      if (r.body !== null) lines.push(`--data-raw ${sq(r.body)}`);
      return lines.join(" \\\n  ");
    }
    case "fetch": {
      const json = jsonLiteral(r.body, r.headers);
      const opts = [`  method: ${js(r.method)},`];
      if (r.headers.length) opts.push(`  headers: {\n${r.headers.map(([k, v]) => `    ${js(k)}: ${js(v)},`).join("\n")}\n  },`);
      if (json) opts.push(`  body: JSON.stringify(${indent(json, "  ")}),`);
      else if (r.body !== null) opts.push(`  body: ${js(r.body)},`);
      else if (r.multipart) opts.push("  body: form,");
      const pre = r.multipart ? `const form = new FormData();\n${r.multipart.map(([k, v]) => `form.append(${js(k)}, ${js(v)});`).join("\n")}\n\n` : "";
      return `${pre}const response = await fetch(${js(r.url)}, {\n${opts.join("\n")}\n});\n\nconsole.log(response.status);\nconsole.log(await response.text());`;
    }
    case "axios": {
      const json = jsonLiteral(r.body, r.headers);
      const opts = [`  method: ${js(r.method.toLowerCase())},`, `  url: ${js(r.url)},`];
      if (r.headers.length) opts.push(`  headers: {\n${r.headers.map(([k, v]) => `    ${js(k)}: ${js(v)},`).join("\n")}\n  },`);
      if (json) opts.push(`  data: ${indent(json, "  ")},`);
      else if (r.body !== null) opts.push(`  data: ${js(r.body)},`);
      else if (r.multipart) opts.push("  data: form,");
      const pre = r.multipart ? `const form = new FormData();\n${r.multipart.map(([k, v]) => `form.append(${js(k)}, ${js(v)});`).join("\n")}\n\n` : "";
      return `import axios from "axios";\n\n${pre}const response = await axios({\n${opts.join("\n")}\n});\n\nconsole.log(response.status, response.data);`;
    }
    case "python": {
      const json = jsonLiteral(r.body, r.headers);
      const args = [`    ${py(r.url)},`];
      const headers = json ? r.headers.filter(([k]) => k.toLowerCase() !== "content-type") : r.headers;
      if (headers.length) args.push(`    headers={\n${headers.map(([k, v]) => `        ${py(k)}: ${py(v)},`).join("\n")}\n    },`);
      if (json) args.push(`    json=${indent(json.replace(/\btrue\b/g, "True").replace(/\bfalse\b/g, "False").replace(/\bnull\b/g, "None"), "    ")},`);
      else if (r.body !== null) args.push(`    data=${py(r.body)},`);
      else if (r.multipart) args.push(`    files={\n${r.multipart.map(([k, v]) => `        ${py(k)}: (None, ${py(v)}),`).join("\n")}\n    },`);
      return `import requests\n\nresponse = requests.request(\n    ${py(r.method)},\n${args.join("\n")}\n)\n\nprint(response.status_code)\nprint(response.text)`;
    }
    case "php": {
      const opts = [`    CURLOPT_URL => ${js(r.url)},`, "    CURLOPT_RETURNTRANSFER => true,", `    CURLOPT_CUSTOMREQUEST => ${js(r.method)},`];
      if (r.headers.length) opts.push(`    CURLOPT_HTTPHEADER => [\n${r.headers.map(([k, v]) => `        ${js(`${k}: ${v}`)},`).join("\n")}\n    ],`);
      if (r.body !== null) opts.push(`    CURLOPT_POSTFIELDS => ${js(r.body)},`);
      else if (r.multipart) opts.push(`    CURLOPT_POSTFIELDS => [\n${r.multipart.map(([k, v]) => `        ${js(k)} => ${js(v)},`).join("\n")}\n    ],`);
      return `<?php\n$ch = curl_init();\ncurl_setopt_array($ch, [\n${opts.join("\n")}\n]);\n\n$response = curl_exec($ch);\necho curl_getinfo($ch, CURLINFO_HTTP_CODE) . "\\n" . $response;\ncurl_close($ch);`;
    }
  }
}

// --- cURL import ----------------------------------------------------------------------------------

/** Splits a shell command into words, honoring quotes and backslash line continuations. */
function shellWords(cmd: string): string[] {
  const words: string[] = [];
  let cur = "";
  let has = false;
  let quote: "'" | '"' | null = null;
  const text = cmd.replace(/\\\r?\n/g, " ");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else cur += c;
    } else if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && i + 1 < text.length && '"\\$`'.includes(text[i + 1])) cur += text[++i];
      else cur += c;
    } else if (c === "'" || c === '"') {
      quote = c;
      has = true;
    } else if (c === "$" && text[i + 1] === "'") {
      // $'…' (ANSI-C quoting, as Chrome's "Copy as cURL" uses): treat like single quotes, unescaping \' and \\n.
      let j = i + 2;
      let s = "";
      while (j < text.length && text[j] !== "'") {
        if (text[j] === "\\" && j + 1 < text.length) {
          const n = text[++j];
          s += n === "n" ? "\n" : n === "t" ? "\t" : n;
        } else s += text[j];
        j++;
      }
      cur += s;
      has = true;
      i = j;
    } else if (c === "\\" && i + 1 < text.length) {
      cur += text[++i];
      has = true;
    } else if (/\s/.test(c)) {
      if (has || cur) words.push(cur);
      cur = "";
      has = false;
    } else {
      cur += c;
      has = true;
    }
  }
  if (has || cur) words.push(cur);
  return words;
}

/** Reads a cURL command into a request. Throws with a readable message if it isn't one. */
export function parseCurl(cmd: string): ApiRequest {
  const words = shellWords(cmd.trim());
  if (words[0] !== "curl") throw new Error("Paste a command that starts with curl.");
  let method: string | null = null;
  let url = "";
  const headers: KV[] = [];
  const data: string[] = [];
  const form: KV[] = [];
  let urlencoded = false;
  let getData = false;
  let user: string | null = null;

  const takesValue = new Set(["-o", "--output", "-m", "--max-time", "--connect-timeout", "-A", "--user-agent", "-e", "--referer", "-b", "--cookie", "-c", "--cookie-jar", "-w", "--write-out", "--retry", "-x", "--proxy", "--cacert", "--cert", "--key", "-r", "--range"]);
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    const next = () => words[++i] ?? "";
    if (w === "-X" || w === "--request") method = next().toUpperCase();
    else if (w.startsWith("-X") && w.length > 2) method = w.slice(2).toUpperCase();
    else if (w === "-H" || w === "--header") {
      const h = next();
      const c = h.indexOf(":");
      if (c > 0) headers.push(kv(h.slice(0, c).trim(), h.slice(c + 1).trim()));
    } else if (["-d", "--data", "--data-raw", "--data-binary", "--data-ascii", "--json"].includes(w)) {
      data.push(next());
      if (w === "--json") {
        headers.push(kv("Content-Type", "application/json"));
        headers.push(kv("Accept", "application/json"));
      }
    } else if (w === "--data-urlencode") {
      const d = next();
      const eq = d.indexOf("=");
      data.push(eq === -1 ? encodeURIComponent(d) : `${d.slice(0, eq)}=${encodeURIComponent(d.slice(eq + 1))}`);
      urlencoded = true;
    } else if (w === "-F" || w === "--form") {
      const f = next();
      const eq = f.indexOf("=");
      form.push(kv(eq === -1 ? f : f.slice(0, eq), eq === -1 ? "" : f.slice(eq + 1)));
    } else if (w === "-u" || w === "--user") user = next();
    else if (w === "-G" || w === "--get") getData = true;
    else if (w === "-I" || w === "--head") method = "HEAD";
    else if (w === "--url") url = next();
    else if (takesValue.has(w)) next();
    else if (w.startsWith("-")) continue; // -L, -s, -k, --compressed, …
    else if (!url) url = w;
  }
  if (!url) throw new Error("No URL found in the command.");

  const req = newRequest({ headers });
  const body = data.join("&");
  if (getData && body) url += (url.includes("?") ? "&" : "?") + body;
  Object.assign(req, splitUrl(url, []));
  req.method = (METHODS as readonly string[]).includes(method ?? "") ? (method as Method) : form.length || (body && !getData) ? "POST" : "GET";

  if (form.length) {
    req.bodyMode = "multipart";
    req.form = form;
  } else if (body && !getData) {
    const type = headers.find((h) => h.key.toLowerCase() === "content-type")?.value ?? "";
    if (type.includes("json") || (!type && /^\s*[[{]/.test(body))) {
      req.bodyMode = "json";
      try {
        req.body = JSON.stringify(JSON.parse(body), null, 2);
      } catch {
        req.body = body;
      }
    } else if (type.includes("x-www-form-urlencoded") || (!type && (urlencoded || /^[^=&\s]+=[^&]*(&[^=&\s]+=[^&]*)*$/.test(body)))) {
      req.bodyMode = "form";
      req.form = [...new URLSearchParams(body)].map(([k, v]) => kv(k, v));
    } else {
      req.bodyMode = type.includes("xml") ? "xml" : "text";
      req.body = body;
    }
    // The body mode supplies Content-Type for these.
    if (req.bodyMode !== "text") req.headers = req.headers.filter((h) => h.key.toLowerCase() !== "content-type" || !h.value.includes(BODY_TYPES[req.bodyMode as "json"]));
  }
  if (user !== null) {
    const c = user.indexOf(":");
    req.auth = { ...emptyAuth(), type: "basic", username: c === -1 ? user : user.slice(0, c), password: c === -1 ? "" : user.slice(c + 1) };
  } else {
    const authHeader = req.headers.find((h) => h.key.toLowerCase() === "authorization" && /^bearer\s/i.test(h.value));
    if (authHeader) {
      req.auth = { ...emptyAuth(), type: "bearer", token: authHeader.value.replace(/^bearer\s+/i, "") };
      req.headers = req.headers.filter((h) => h !== authHeader);
    }
  }
  return req;
}
