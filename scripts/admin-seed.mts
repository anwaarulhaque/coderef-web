// Creates the superadmin (ADMIN_SUPERADMIN_EMAIL, default anwaar@formclick.io) so they can sign in at /admin/login with an
// emailed code. Idempotent. Employees are added from the panel by the superadmin.   npm run admin:seed
import { neon } from "@neondatabase/serverless";
import { config } from "../src/server/config.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (add it to .env)");
const sql = neon(process.env.DATABASE_URL);
const email = config.admin.superadminEmail;
await sql`
  insert into admins (email, name, role) values (${email}, 'Superadmin', 'superadmin')
  on conflict (email) do update set role = 'superadmin', active = true`;
console.log(`Superadmin ${email} is ready: sign in at /admin/login with an emailed code.`);
