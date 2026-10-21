// Conversions to and from JSON: YAML, XML, CSV, TypeScript interfaces and JSON Schema.
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { dump, load } from "js-yaml";
import Papa from "papaparse";

export type Target = "yaml" | "xml" | "csv" | "typescript" | "schema";
export type Source = "yaml" | "xml" | "csv";

export const TARGETS: { id: Target; label: string; language: "yaml" | "xml" | "text" | "typescript" | "json"; ext: string }[] = [
  { id: "yaml", label: "YAML", language: "yaml", ext: "yaml" },
  { id: "xml", label: "XML", language: "xml", ext: "xml" },
  { id: "csv", label: "CSV", language: "text", ext: "csv" },
  { id: "typescript", label: "TypeScript", language: "typescript", ext: "ts" },
  { id: "schema", label: "JSON Schema", language: "json", ext: "schema.json" },
];

// ---------- to ----------

export const toYaml = (value: unknown) => dump(value, { lineWidth: 120, noRefs: true });

const xmlName = (key: string) => {
  const cleaned = key.replace(/[^\w.-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) ? cleaned : `_${cleaned}`;
};

function xmlSafe(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(xmlSafe);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [xmlName(k), xmlSafe(v)]));
  }
  return value;
}

export function toXml(value: unknown, root = "root"): string {
  // A top-level array becomes repeated <item> elements under the root.
  const body = Array.isArray(value) ? { item: xmlSafe(value) } : value !== null && typeof value === "object" ? xmlSafe(value) : { value };
  const builder = new XMLBuilder({ format: true, indentBy: "  ", suppressEmptyNode: true });
  return `<?xml version="1.0" encoding="UTF-8"?>\n${builder.build({ [root]: body })}`;
}

/** Flattens nested objects into dot.path columns; arrays of primitives join with "; ". */
function flatten(obj: unknown, prefix = "", out: Record<string, unknown> = {}): Record<string, unknown> {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else if (Array.isArray(obj)) {
    if (obj.every((x) => x === null || typeof x !== "object")) out[prefix] = obj.join("; ");
    else obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else {
    out[prefix || "value"] = obj;
  }
  return out;
}

export function toCsv(value: unknown): string {
  const rows = Array.isArray(value) ? value : [value];
  const flat = rows.map((r) => flatten(r));
  const columns = [...new Set(flat.flatMap((r) => Object.keys(r)))];
  return Papa.unparse({ fields: columns, data: flat.map((r) => columns.map((c) => r[c] ?? "")) });
}

// ---------- TypeScript ----------

const pascal = (s: string) =>
  (s.replace(/[^A-Za-z0-9]+(.)?/g, (_, c: string | undefined) => (c ? c.toUpperCase() : "")).replace(/^./, (c) => c.toUpperCase()) || "Item").replace(/^(\d)/, "_$1");
const singular = (s: string) => (s.endsWith("ies") ? s.slice(0, -3) + "y" : s.endsWith("s") && !s.endsWith("ss") ? s.slice(0, -1) : s);
const tsKey = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k));

export function toTypeScript(value: unknown, rootName = "Root"): string {
  const interfaces = new Map<string, string>();

  const typeFor = (v: unknown, name: string): string => {
    if (v === null) return "null";
    if (Array.isArray(v)) {
      if (v.length === 0) return "unknown[]";
      const objects = v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as Record<string, unknown>[];
      const others = v.filter((x) => !(x && typeof x === "object" && !Array.isArray(x)));
      const types = new Set(others.map((x) => typeFor(x, name)));
      if (objects.length) types.add(objectType(objects, singular(name)));
      const union = [...types].join(" | ");
      return types.size > 1 ? `(${union})[]` : `${union}[]`;
    }
    if (typeof v === "object") return objectType([v as Record<string, unknown>], name);
    return typeof v;
  };

  // Merges several sample objects: keys missing from some become optional.
  const objectType = (samples: Record<string, unknown>[], name: string): string => {
    let iname = pascal(name);
    while (interfaces.has(iname) && !interfaces.get(iname)!.startsWith(`interface ${iname} `)) iname += "2";
    const keys = [...new Set(samples.flatMap((s) => Object.keys(s)))];
    const lines = keys.map((k) => {
      const present = samples.filter((s) => k in s);
      const types = new Set(present.map((s) => typeFor(s[k], k)));
      // An empty array in one sample says nothing about the element type if another sample knows it.
      if (types.has("unknown[]") && [...types].some((t) => t !== "unknown[]" && t.endsWith("[]"))) types.delete("unknown[]");
      const optional = present.length < samples.length ? "?" : "";
      return `  ${tsKey(k)}${optional}: ${[...types].join(" | ")};`;
    });
    interfaces.set(iname, `interface ${iname} {\n${lines.join("\n")}\n}`);
    return iname;
  };

  const top = typeFor(value, rootName);
  const decls = [...interfaces.values()].reverse().map((d) => `export ${d}`);
  if (!interfaces.has(pascal(rootName))) decls.push(`export type ${pascal(rootName)} = ${top};`);
  return decls.join("\n\n") + "\n";
}

// ---------- JSON Schema ----------

export function toJsonSchema(value: unknown): string {
  const schemaFor = (v: unknown): Record<string, unknown> => {
    if (v === null) return { type: "null" };
    if (Array.isArray(v)) {
      if (!v.length) return { type: "array" };
      const item = schemaFor(v[0]);
      return { type: "array", items: item };
    }
    switch (typeof v) {
      case "string":
        return /^\d{4}-\d{2}-\d{2}T/.test(v) ? { type: "string", format: "date-time" } : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? { type: "string", format: "email" } : /^https?:\/\//.test(v) ? { type: "string", format: "uri" } : { type: "string" };
      case "number":
        return { type: Number.isInteger(v) ? "integer" : "number" };
      case "boolean":
        return { type: "boolean" };
      case "object": {
        const entries = Object.entries(v as object);
        return { type: "object", properties: Object.fromEntries(entries.map(([k, x]) => [k, schemaFor(x)])), required: entries.map(([k]) => k), additionalProperties: false };
      }
    }
    return {};
  };
  return JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema", ...schemaFor(value) }, null, 2);
}

export function convertTo(target: Target, value: unknown): string {
  switch (target) {
    case "yaml": return toYaml(value);
    case "xml": return toXml(value);
    case "csv": return toCsv(value);
    case "typescript": return toTypeScript(value);
    case "schema": return toJsonSchema(value);
  }
}

// ---------- from ----------

export function convertFrom(source: Source, text: string): unknown {
  switch (source) {
    case "yaml":
      return load(text);
    case "xml":
      return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@", parseTagValue: true }).parse(text);
    case "csv": {
      const r = Papa.parse<Record<string, unknown>>(text.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
      if (r.errors.length) throw new Error(`CSV row ${(r.errors[0].row ?? 0) + 2}: ${r.errors[0].message}`);
      return r.data;
    }
  }
}
