// Reports which backend settings are present. Prints names only; values are never shown.
//   node --env-file=.env scripts/check-env.mjs
const groups = {
  database: ["DATABASE_URL"],
  aws: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"],
  payments: ["PAYMENT_MODE", "DODO_PAYMENT_KEY", "DODO_WEBHOOK_SECRET"],
  optional: ["EMAIL_FROM", "SES_REGION", "SITE_URL", "AWS_DEFAULT_REGION"],
};
for (const [group, keys] of Object.entries(groups)) {
  console.log(`${group}: ${keys.map((k) => `${k}=${process.env[k] ? "set" : "missing"}`).join("  ")}`);
}
const mode = process.env.PAYMENT_MODE;
if (mode) console.log(`PAYMENT_MODE value is ${/^(test|live)$/i.test(mode) ? mode.toUpperCase() : "unrecognised (expected TEST or LIVE)"}`);
const key = process.env.DODO_PAYMENT_KEY ?? "";
if (key) console.log(`DODO_PAYMENT_KEY looks like a ${key.startsWith("dodo_test_") ? "test" : key.startsWith("dodo_live_") ? "live" : "non-prefixed"} key`);
const extra = Object.keys(process.env).filter((k) => /^(AWS|DODO|NEON|PG|DATABASE|SES|SMTP|EMAIL|PAYMENT)/.test(k) && !Object.values(groups).flat().includes(k));
if (extra.length) console.log(`other related names found: ${extra.join(", ")}`);
