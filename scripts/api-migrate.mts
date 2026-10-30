// Creates or updates the database tables (idempotent).  npm run api:migrate
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (add it to .env)");
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(new URL("../src/server/schema.sql", import.meta.url), "utf8")
  .split(/;\s*$/m)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);
for (const s of statements) await sql.query(s);
const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by 1`;
console.log(`Applied ${statements.length} statements. Tables: ${tables.map((t) => t.table_name).join(", ")}`);
