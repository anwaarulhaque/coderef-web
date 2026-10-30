// Verification emails through Amazon SES, from noreply@mail.coderef.xyz (a verified SES domain).
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { config } from "./config.ts";

let ses: SESv2Client | null = null;

export async function sendCodeEmail(to: string, code: string, isNewAccount: boolean, admin = false): Promise<void> {
  ses ??= new SESv2Client({ region: config.sesRegion });
  const action = admin ? "sign in to the CodeRef admin panel" : isNewAccount ? "create your CodeRef account" : "sign in to CodeRef";
  const subject = `${code} is your CodeRef verification code`;
  const text = `Your verification code is ${code}\n\nEnter it to ${action}. It expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email: nobody can sign in without the code.\n\n— CodeRef · ${config.siteUrl}\n`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16181d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border:1px solid #e1e4ea;border-radius:12px">
<tr><td style="padding:28px 28px 8px;font:600 18px/1 ui-monospace,Menlo,monospace">code<span style="color:#2563eb">ref</span></td></tr>
<tr><td style="padding:8px 28px 0;font-size:15px;line-height:1.5">Enter this code to ${action}:</td></tr>
<tr><td style="padding:16px 28px"><div style="font:700 32px/1 ui-monospace,Menlo,monospace;letter-spacing:8px;background:#f6f7f9;border-radius:8px;padding:16px;text-align:center">${code}</div></td></tr>
<tr><td style="padding:0 28px 28px;font-size:13px;line-height:1.5;color:#5b6270">It expires in 10 minutes. If you didn't request it, ignore this email: nobody can sign in without the code.</td></tr>
</table></td></tr></table></body></html>`;
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: config.emailFrom,
      Destination: { ToAddresses: [to] },
      Content: { Simple: { Subject: { Data: subject, Charset: "UTF-8" }, Body: { Text: { Data: text, Charset: "UTF-8" }, Html: { Data: html, Charset: "UTF-8" } } } },
    }),
  );
}

/** A plain transactional email (refund requests). Set replyTo so support can answer the customer directly. */
export async function sendPlainEmail(p: { to: string; subject: string; text: string; replyTo?: string }): Promise<void> {
  ses ??= new SESv2Client({ region: config.sesRegion });
  await ses.send(
    new SendEmailCommand({
      FromEmailAddress: config.emailFrom,
      Destination: { ToAddresses: [p.to] },
      ReplyToAddresses: p.replyTo ? [p.replyTo] : undefined,
      Content: { Simple: { Subject: { Data: p.subject, Charset: "UTF-8" }, Body: { Text: { Data: p.text, Charset: "UTF-8" } } } },
    }),
  );
}
