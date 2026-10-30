// Backend settings, read once from the environment. Secrets live in Vercel's environment variables (or .env locally).
import products from "./dodo-products.json" with { type: "json" };
import type { PlanId } from "../lib/plans.ts";

const env = (k: string, fallback = "") => (process.env[k] ?? fallback).trim();

const mode = env("PAYMENT_MODE", "TEST").toLowerCase() === "live" ? "live" : "test";
const fileProducts = (products as Record<string, Partial<Record<PlanId, string>>>)[mode] ?? {};

export const config = {
  databaseUrl: env("DATABASE_URL"),
  siteUrl: (env("SITE_URL") || env("NEXT_PUBLIC_SITE_URL", "https://coderef.xyz")).replace(/\/+$/, ""),
  cdnUrl: env("CDN_URL", "https://cdn.coderef.xyz").replace(/\/+$/, ""),
  emailFrom: env("EMAIL_FROM", "CodeRef <noreply@mail.coderef.xyz>"),
  sesRegion: env("SES_REGION") || env("AWS_REGION", "us-east-1"),
  /** Paid plans are frozen ("coming soon") until PAYMENTS_ENABLED=1, e.g. while Dodo hasn't approved live payments. */
  payments: { enabled: env("PAYMENTS_ENABLED") === "1" },
  admin: { superadminEmail: (env("ADMIN_SUPERADMIN_EMAIL") || "anwaar@formclick.io").toLowerCase() },
  dodo: {
    mode,
    baseUrl: mode === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com",
    apiKey: env("DODO_PAYMENT_KEY"),
    webhookSecret: env("DODO_WEBHOOK_SECRET"),
    products: {
      monthly: env("DODO_PRODUCT_MONTHLY") || fileProducts.monthly || "",
      yearly: env("DODO_PRODUCT_YEARLY") || fileProducts.yearly || "",
      lifetime: env("DODO_PRODUCT_LIFETIME") || fileProducts.lifetime || "",
    } satisfies Record<PlanId, string>,
  },
  /** Cookies get `Secure` everywhere except `next dev` on plain http. */
  secureCookies: process.env.NODE_ENV === "production",
};

export const planForProduct = (productId: string | undefined): PlanId | undefined =>
  (Object.entries(config.dodo.products) as [PlanId, string][]).find(([, id]) => id && id === productId)?.[0];
