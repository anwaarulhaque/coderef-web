// Build-time access to the site's data files, which live on the CDN (scripts/cdn.mjs uploads them) rather than
// in the repo. Each file is fetched once per build process; CODEREF_DATA_URL points the build at another copy.
import { CDN_URL } from "./design-md-shared";

const DATA_URL = (process.env.CODEREF_DATA_URL ?? CDN_URL).replace(/\/+$/, "");
const memo = new Map<string, Promise<string>>();

async function get(path: string): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${DATA_URL}/${path}`);
    if (res.ok) return res.text();
    if (attempt >= 3 || res.status < 500) throw new Error(`${DATA_URL}/${path}: HTTP ${res.status}`);
    await new Promise((r) => setTimeout(r, attempt * 500));
  }
}

/** A data file as text, e.g. "data/design-md/THIRD_PARTY_LICENSES.md". */
export function cdnText(path: string): Promise<string> {
  let p = memo.get(path);
  if (!p) {
    p = get(path);
    p.catch(() => memo.delete(path)); // retry on the next call
    memo.set(path, p);
  }
  return p;
}

export const cdnJson = async <T,>(path: string): Promise<T> => JSON.parse(await cdnText(path)) as T;
