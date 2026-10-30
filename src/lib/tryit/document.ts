// Turns the editor's HTML, CSS and JavaScript into one page for the result frame, and packs code into share links.

export type TryItCode = { html: string; css: string; js: string };

export const TRY_IT_MESSAGE = "coderef:try-it";

/** Placeholder for the line the JavaScript starts on; filled in once the page is assembled. */
const JS_LINE = "__CODEREF_JS_LINE__";

// Forwards console calls and uncaught errors to the editor. Kept on a single line so that line
// numbers in the user's HTML still match the page the browser reports errors against.
const CONSOLE_BRIDGE = `<script>(function(){var JS=${JS_LINE};function f(v,d){try{if(v===undefined)return"undefined";if(v===null)return"null";var t=typeof v;if(t==="string")return d?JSON.stringify(v):v;if(t==="bigint")return v+"n";if(t!=="object"&&t!=="function")return String(v);if(t==="function")return"ƒ "+(v.name||"anonymous")+"()";if(v instanceof Error)return v.name+": "+v.message;if(typeof Element!=="undefined"&&v instanceof Element){var h=v.outerHTML;return h.length>300?h.slice(0,300)+"…":h}if(v instanceof Date)return v.toISOString();if(v instanceof RegExp)return String(v);if(d>2)return Array.isArray(v)?"[…]":"{…}";if(Array.isArray(v))return"["+v.map(function(x){return f(x,d+1)}).join(", ")+"]";if(v instanceof Map)return"Map("+v.size+") {"+Array.from(v).map(function(e){return f(e[0],d+1)+" => "+f(e[1],d+1)}).join(", ")+"}";if(v instanceof Set)return"Set("+v.size+") {"+Array.from(v).map(function(x){return f(x,d+1)}).join(", ")+"}";var n=v.constructor&&v.constructor!==Object&&v.constructor.name?v.constructor.name+" ":"";return n+"{"+Object.keys(v).map(function(k){return k+": "+f(v[k],d+1)}).join(", ")+"}"}catch(e){return String(v)}}function s(l,a){try{parent.postMessage({source:"${TRY_IT_MESSAGE}",level:l,text:Array.prototype.map.call(a,function(x){return f(x,0)}).join(" ")},"*")}catch(e){}}["log","info","warn","error","debug","table"].forEach(function(m){var o=console[m];console[m]=function(){s(m==="table"?"log":m,arguments);return o.apply(console,arguments)}});console.clear=function(){s("clear",[])};function w(l){return l>=JS?" (JavaScript line "+(l-JS+1)+")":" (line "+l+")"}addEventListener("error",function(e){if(!e.message)return;var r=e.error;s("error",[(r&&r.name?r.name+": "+r.message:e.message)+(e.lineno?w(e.lineno):"")])});addEventListener("unhandledrejection",function(e){s("error",["Uncaught (in promise) "+f(e.reason,0)])})})();</script>`;

const isFullDocument = (html: string) => /<(html|head|body)[\s>]/i.test(html);

/** Inserts `snippet` right after the opening <head>, <html> or doctype, whichever comes first in that order. */
function insertAtTop(html: string, snippet: string) {
  const m = /<head(?:\s[^>]*)?>/i.exec(html) ?? /<html(?:\s[^>]*)?>/i.exec(html) ?? /<!doctype[^>]*>/i.exec(html);
  if (!m) return snippet + html;
  const at = m.index + m[0].length;
  return html.slice(0, at) + snippet + html.slice(at);
}

/** Index of the last closing </body> or </html>, or the end of the text. */
function bottomIndex(html: string) {
  const lower = html.toLowerCase();
  const body = lower.lastIndexOf("</body");
  if (body !== -1) return body;
  const end = lower.lastIndexOf("</html");
  return end !== -1 ? end : html.length;
}

/**
 * Builds the page. The HTML may be a whole document or just body content. CSS and JavaScript go at
 * the end of the body (styles there still apply to the whole page), so line numbers in the HTML
 * stay the same as in the editor.
 */
export function buildDocument(code: TryItCode, { bridge = true }: { bridge?: boolean } = {}) {
  const head = bridge ? CONSOLE_BRIDGE : "";
  const page = isFullDocument(code.html)
    ? insertAtTop(code.html, head)
    : `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}</head><body>${code.html}\n</body></html>`;

  const css = code.css.trim() ? `\n<style>\n${code.css}\n</style>` : "";
  // A literal "</script" inside the code would end the script element early.
  const jsOpen = "\n<script>\n";
  const js = code.js.trim() ? `${jsOpen}${code.js.replace(/<\/script/gi, "<\\/script")}\n</script>\n` : "";

  const at = bottomIndex(page);
  const before = page.slice(0, at) + css;
  const doc = before + js + page.slice(at);
  // 1-based line on which the JavaScript's first line sits.
  const jsLine = js ? (before + jsOpen).split("\n").length : Number.MAX_SAFE_INTEGER;
  return doc.replace(JS_LINE, String(jsLine));
}

// Share links: code goes in the URL fragment, so it never reaches a server.

const toBase64Url = (bytes: Uint8Array) => {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (text: string) => {
  const bin = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};

const pack = (code: Partial<TryItCode>) => new TextEncoder().encode(JSON.stringify([code.html ?? "", code.css ?? "", code.js ?? ""]));

const unpack = (bytes: Uint8Array): TryItCode => {
  const [html, css, js] = JSON.parse(new TextDecoder().decode(bytes)) as string[];
  return { html: String(html ?? ""), css: String(css ?? ""), js: String(js ?? "") };
};

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/** A link to the editor preloaded with this code (uncompressed; usable while rendering on the server). */
export const tryItHref = (code: Partial<TryItCode>, path = "/try-it/") => `${path}#c=${toBase64Url(pack(code))}`;

/** A compressed share fragment ("z=…"), falling back to uncompressed ("c=…") where compression isn't available. */
export async function encodeShareHash(code: TryItCode) {
  if (typeof CompressionStream === "undefined") return `c=${toBase64Url(pack(code))}`;
  return `z=${toBase64Url(await pipe(pack(code), new CompressionStream("deflate-raw")))}`;
}

/** Reads code from a location hash made by tryItHref or encodeShareHash; null if there is none or it's broken. */
export async function decodeShareHash(hash: string): Promise<TryItCode | null> {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  try {
    const z = params.get("z");
    if (z) return unpack(await pipe(fromBase64Url(z), new DecompressionStream("deflate-raw")));
    const c = params.get("c");
    if (c) return unpack(fromBase64Url(c));
  } catch {
    // Fall through: a damaged link loads the editor normally.
  }
  return null;
}
