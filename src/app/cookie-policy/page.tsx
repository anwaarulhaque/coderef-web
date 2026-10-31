import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { SUPPORT_EMAIL } from "@/lib/plans";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({ title: "Cookie policy", description: "The cookies and browser storage CodeRef uses, what each is for, and how to control them.", path: "/cookie-policy/" });

const th = "py-2 pr-4 text-left font-semibold";
const td = "py-2 pr-4 align-top";

export default function Page() {
  return (
    <LegalPage title="Cookie policy" updated="October 31, 2026">
      <p>
        This page explains the cookies and similar browser storage used on coderef.xyz. For how we handle personal data more broadly, see the <Link href="/privacy/">privacy policy</Link>.
      </p>

      <h2>In short</h2>
      <ul>
        <li>We use one cookie to keep you signed in, and your browser&apos;s local storage to remember your work in the tools.</li>
        <li>We use Google Analytics and Microsoft Clarity to see which pages are used.</li>
        <li>No advertising or cross-site tracking cookies, and we don&apos;t sell data.</li>
        <li>You can block or delete cookies in your browser at any time. Free tools still work without an account.</li>
      </ul>

      <h2>What we use</h2>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[34rem] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Name</th>
              <th className={th}>Purpose</th>
              <th className={th}>Lasts</th>
              <th className={th}>Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr>
              <td className={td}><code>cr_session</code></td>
              <td className={td}>Keeps you signed in to your CodeRef account. HttpOnly, so scripts can&apos;t read it.</td>
              <td className={td}>30 days</td>
              <td className={td}>Essential</td>
            </tr>
            <tr>
              <td className={td}><code>cr_admin</code></td>
              <td className={td}>Keeps CodeRef staff signed in to the admin panel. Set only for staff; HttpOnly.</td>
              <td className={td}>7 days</td>
              <td className={td}>Essential (staff)</td>
            </tr>
            <tr>
              <td className={td}>Local storage (your browser)</td>
              <td className={td}>Remembers your last work in a tool and your display preferences, so a refresh doesn&apos;t lose it. It stays on your device and is never sent to us unless you save to your account.</td>
              <td className={td}>Until you clear it</td>
              <td className={td}>Functional</td>
            </tr>
            <tr>
              <td className={td}><code>_ga</code>, <code>_ga_*</code></td>
              <td className={td}>Google Analytics: counts visits and shows which pages are used (pages viewed, device type).</td>
              <td className={td}>Up to 2 years</td>
              <td className={td}>Analytics</td>
            </tr>
            <tr>
              <td className={td}><code>_clck</code>, <code>_clsk</code>, <code>CLID</code></td>
              <td className={td}>Microsoft Clarity: usage analytics such as clicks and scrolling, to find confusing pages.</td>
              <td className={td}>1 day to 1 year</td>
              <td className={td}>Analytics</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Durations are those set by Google and Microsoft and may change. We don&apos;t use advertising or cross-site tracking cookies, and we don&apos;t sell data.</p>

      <h2>Payments</h2>
      <p>When paid plans are available, checkout happens on a page hosted by Dodo Payments, our merchant of record. That page runs on Dodo&apos;s domain and sets its own cookies under Dodo&apos;s policy. CodeRef never sees your card details.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Essential cookies are needed to sign in. Without them you can still use every free tool, just not an account.</li>
        <li>You can block or delete cookies and local storage in your browser settings at any time. Analytics cookies come back only if you allow them again.</li>
        <li>To opt out of Google Analytics across all sites, use <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer">Google&apos;s opt-out add-on</a>. Clarity has its own controls in <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">Microsoft&apos;s privacy settings</a>.</li>
        <li>Signing out removes your session cookie from the device.</li>
      </ul>

      <h2>Changes and questions</h2>
      <p>If we add or change cookies we&apos;ll update this page and its date. Questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    </LegalPage>
  );
}
