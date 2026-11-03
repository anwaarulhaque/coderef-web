"use client";

// Teams: the list of a user's teams, creating one (Start Team plan), and the admin page for one team: branding,
// members and roles, invitations, team pages, the default page, allowed email domains and link analytics.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiError, useAccount } from "@/lib/account/client";
import { hostOf, startApi, type TeamDetail, type TeamRole, type TeamSummary } from "@/lib/start/client";
import { btn, btnPrimary, input, label } from "./ui";

const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);
const card = "rounded-2xl border border-border bg-surface p-5";

export function TeamsList() {
  const router = useRouter();
  const tier = useAccount().me?.start?.tier ?? "free";
  const [teams, setTeams] = useState<TeamSummary[] | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    startApi
      .teams()
      .then(setTeams)
      .catch(() => setTeams([]));
  }, []);
  const canCreate = tier === "team" || tier === "enterprise";
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/start/" className="hover:text-foreground">
          CodeRef Start
        </Link>{" "}
        / Teams
      </p>
      <h1 className="mt-1 text-2xl font-semibold">Teams</h1>
      <p className="mt-1 text-sm text-muted">Shared start pages for everyone on your team, with your branding, roles and analytics.</p>
      <div className="mt-6 grid gap-3">
        {teams === null && <p className="text-sm text-muted">Loading…</p>}
        {teams?.map((t) => (
          <div key={t.id} className={`${card} flex flex-wrap items-center gap-3`}>
            <span className="grid size-10 place-items-center rounded-xl text-lg font-bold text-white" style={{ background: t.brandColor ?? "var(--accent)" }}>
              {t.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.name}</p>
              <p className="text-xs text-muted">
                /start/t/{t.slug} · {t.members} of {t.seatLimit > 10_000 ? "unlimited" : t.seatLimit} members · {t.role}
                {!t.active && " · plan ended"}
              </p>
            </div>
            <Link href={`/start/t/${t.slug}/`} className={btn}>
              Open
            </Link>
            {(t.role === "owner" || t.role === "admin") && (
              <Link href={`/start/teams/${t.id}/`} className={btnPrimary}>
                Manage
              </Link>
            )}
          </div>
        ))}
        {teams?.length === 0 && <p className="text-sm text-muted">You&apos;re not on a team yet. Ask your admin for an invitation, or create one.</p>}
      </div>
      <section className={`${card} mt-8`}>
        <h2 className="font-semibold">Create a team</h2>
        {canCreate ? (
          <form
            className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              try {
                const r = await startApi.createTeam(name, slug || name);
                router.push(`/start/teams/${r.id}/`);
              } catch (err) {
                setError(errText(err, "Couldn't create the team."));
              }
            }}
          >
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." aria-label="Team name" required />
            <input className={input} value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="acme (address)" aria-label="Team address" />
            <button type="submit" className={btnPrimary}>
              Create
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-muted">
            Teams are part of Start Team ($29 / month for 10 members).{" "}
            <Link href="/pricing/?product=start" className="font-semibold text-accent">
              See plans
            </Link>
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </section>
    </div>
  );
}

function Analytics({ teamId }: { teamId: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof startApi.analytics>> | null>(null);
  useEffect(() => {
    startApi
      .analytics(teamId)
      .then(setData)
      .catch(() => setData({ top: [], daily: [], pages: [] }));
  }, [teamId]);
  if (!data) return <p className="text-sm text-muted">Loading…</p>;
  const max = Math.max(1, ...data.daily.map((d) => d.clicks));
  const total = data.daily.reduce((s, d) => s + d.clicks, 0);
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-sm text-muted">Link clicks, last 30 days</p>
        <p className="text-3xl font-semibold tabular-nums">{total.toLocaleString()}</p>
        <div className="mt-2 flex h-20 items-end gap-0.5" role="img" aria-label={`Daily clicks over the last 30 days, ${total} in total`}>
          {data.daily.map((d) => (
            <div key={d.day} title={`${d.day}: ${d.clicks}`} className="flex-1 rounded-t bg-accent/70" style={{ height: `${(d.clicks / max) * 100}%` }} />
          ))}
          {!data.daily.length && <p className="text-sm text-muted">No clicks yet.</p>}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className={label}>Most-used links</h3>
          <ol className="divide-y divide-border text-sm">
            {data.top.map((t) => (
              <li key={t.url + t.page} className="flex justify-between gap-2 py-1.5">
                <span className="min-w-0 truncate" title={t.url}>
                  {hostOf(t.url)} <span className="text-xs text-muted">· {t.page}</span>
                </span>
                <span className="tabular-nums">{t.clicks}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className={label}>Page views</h3>
          <ol className="divide-y divide-border text-sm">
            {data.pages.map((p) => (
              <li key={p.title} className="flex justify-between py-1.5">
                <span className="truncate">{p.title}</span>
                <span className="tabular-nums">{p.views}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export function TeamAdmin({ teamId }: { teamId: string }) {
  const [d, setD] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("viewer");
  const [form, setForm] = useState({ name: "", slug: "", logoUrl: "", brandColor: "#2563eb", announcement: "", domains: "" });
  const [tab, setTab] = useState<"members" | "pages" | "settings" | "analytics">("members");

  const apply = useCallback((x: TeamDetail) => {
    setD(x);
    setForm({ name: x.team.name, slug: x.team.slug, logoUrl: x.team.logoUrl ?? "", brandColor: x.team.brandColor ?? "#2563eb", announcement: x.team.announcement, domains: x.team.allowedDomains.join(", ") });
  }, []);
  useEffect(() => {
    startApi
      .team(teamId)
      .then(apply)
      .catch((e) => setError(errText(e, "Couldn't load this team.")));
  }, [teamId, apply]);
  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (ok) setNotice(ok);
    } catch (e) {
      setError(errText(e, "Something went wrong."));
    }
  };
  if (!d) return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-muted">{error ?? "Loading…"}</div>;
  const admin = d.role === "owner" || d.role === "admin";
  const seatsUsed = d.members.length + d.invites.length;
  const tabs = [
    ["members", `Members (${d.members.length})`],
    ["pages", `Pages (${d.pages.length})`],
    ["settings", "Settings"],
    ["analytics", "Analytics"],
  ] as const;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/start/teams/" className="hover:text-foreground">
          Teams
        </Link>{" "}
        / {d.team.name}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{d.team.name}</h1>
        <Link href={`/start/t/${d.team.slug}/`} className={btnPrimary}>
          Open team page
        </Link>
      </div>
      {!d.team.active && (
        <p className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
          This team&apos;s plan has ended. Members can still view pages; renew to add pages and invite people.{" "}
          <Link href="/pricing/?product=start" className="font-semibold text-accent">
            Renew
          </Link>
        </p>
      )}
      <nav className="mt-6 flex gap-1 border-b border-border" aria-label="Team sections">
        {tabs.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === k ? "border-accent font-semibold text-foreground" : "border-transparent text-muted hover:text-foreground"}`}>
            {l}
          </button>
        ))}
      </nav>
      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {notice && (
        <p role="status" className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm break-all">
          {notice}
        </p>
      )}

      {tab === "members" && (
        <div className="mt-6 grid gap-6">
          {admin && (
            <form
              className={`${card} grid gap-3 sm:grid-cols-[1fr_auto_auto]`}
              onSubmit={(e) => {
                e.preventDefault();
                void run(async () => {
                  const r = await startApi.invite(teamId, email, role);
                  setEmail("");
                  apply(await startApi.team(teamId));
                  setNotice(`Invitation sent. You can also share this link: ${r.url}`);
                });
              }}
            >
              <input type="email" required className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" aria-label="Email to invite" />
              <select className={input} value={role} onChange={(e) => setRole(e.target.value as TeamRole)} aria-label="Role">
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                {d.role === "owner" && <option value="admin">Admin</option>}
              </select>
              <button type="submit" className={btnPrimary}>
                Invite
              </button>
              <p className="text-xs text-muted sm:col-span-3">
                {seatsUsed} of {d.team.seatLimit > 10_000 ? "unlimited" : d.team.seatLimit} seats used. Viewers see team pages; editors change them; admins also manage members and settings.
              </p>
            </form>
          )}
          <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
            {d.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{m.email}</span>
                {admin && m.role !== "owner" ? (
                  <select className="rounded-lg border border-border bg-background px-2 py-1 text-sm" value={m.role} onChange={(e) => run(async () => (await startApi.setRole(teamId, m.id, e.target.value as TeamRole), apply(await startApi.team(teamId))))} aria-label={`Role for ${m.email}`}>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                ) : (
                  <span className="text-muted capitalize">{m.role}</span>
                )}
                {admin && m.role !== "owner" && (
                  <button type="button" className="text-xs text-muted hover:text-red-500" onClick={() => confirm(`Remove ${m.email} from the team?`) && run(async () => (await startApi.removeMember(teamId, m.id), apply(await startApi.team(teamId))))}>
                    Remove
                  </button>
                )}
              </li>
            ))}
            {d.invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3 text-sm text-muted">
                <span className="flex-1 truncate">{i.email}</span>
                <span>invited · {i.role}</span>
                <button type="button" className="text-xs hover:text-red-500" onClick={() => run(async () => (await startApi.revokeInvite(teamId, i.id), apply(await startApi.team(teamId))))}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "pages" && (
        <div className="mt-6 grid gap-3">
          {d.pages.map((p) => (
            <div key={p.id} className={`${card} flex flex-wrap items-center gap-3`}>
              <span className="flex-1 font-medium">
                {p.title} {d.team.defaultPageId === p.id && <span className="ml-1 rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Home</span>}
              </span>
              {admin && d.team.defaultPageId !== p.id && (
                <button type="button" className={btn} onClick={() => run(async () => apply(await startApi.updateTeam(teamId, { defaultPageId: p.id })), "Home page updated.")}>
                  Make home page
                </button>
              )}
              <Link href={`/start/${p.id}/`} className={btn}>
                Open
              </Link>
            </div>
          ))}
          {d.role !== "viewer" && (
            <button type="button" className={`${btnPrimary} justify-self-start`} onClick={() => run(async () => (await startApi.createPage({ teamId, title: "New team page" }), apply(await startApi.team(teamId))))}>
              New team page
            </button>
          )}
          <div className={`${card} text-sm`}>
            <h3 className="font-semibold">Roll it out as everyone&apos;s new tab</h3>
            <p className="mt-1 text-muted">
              Ask everyone to install the <Link href="/start-page/extension/" className="text-accent">CodeRef Start extension</Link> and pick the team page in its settings. For managed Chrome, push the extension with <code className="rounded bg-chip px-1">ExtensionInstallForcelist</code> and set its policy <code className="rounded bg-chip px-1">teamSlug</code> to <code className="rounded bg-chip px-1">{d.team.slug}</code>; new tabs then open this team&apos;s home page.
            </p>
          </div>
        </div>
      )}

      {tab === "settings" && admin && (
        <form
          className={`${card} mt-6 grid gap-4 sm:grid-cols-2`}
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              async () =>
                apply(
                  await startApi.updateTeam(teamId, {
                    name: form.name,
                    slug: form.slug,
                    logoUrl: form.logoUrl || null,
                    brandColor: form.brandColor,
                    announcement: form.announcement,
                    allowedDomains: form.domains.split(/[\s,]+/).filter(Boolean),
                  }),
                ),
              "Saved.",
            );
          }}
        >
          <label>
            <span className={label}>Team name</span>
            <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            <span className={label}>Address: /start/t/…</span>
            <input className={input} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })} />
          </label>
          <label>
            <span className={label}>Logo (https image address)</span>
            <input className={input} value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://…/logo.svg" />
          </label>
          <label>
            <span className={label}>Brand colour</span>
            <span className="flex gap-2">
              <input type="color" value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="h-9 w-12 rounded border border-border" aria-label="Brand colour" />
              <input className={input} value={form.brandColor} onChange={(e) => setForm({ ...form, brandColor: e.target.value })} />
            </span>
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Banner on every team page (optional)</span>
            <textarea className={input} rows={2} maxLength={500} value={form.announcement} onChange={(e) => setForm({ ...form, announcement: e.target.value })} />
          </label>
          <label className="sm:col-span-2">
            <span className={label}>Allowed email domains: people with these addresses can join without an invite</span>
            <input className={input} value={form.domains} onChange={(e) => setForm({ ...form, domains: e.target.value })} placeholder="company.com, company.co.uk" />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary}>
              Save settings
            </button>
          </div>
        </form>
      )}
      {tab === "settings" && !admin && <p className="mt-6 text-sm text-muted">Only team owners and admins can change settings.</p>}
      {tab === "analytics" && <div className={`${card} mt-6`}>{admin ? <Analytics teamId={teamId} /> : <p className="text-sm text-muted">Only team owners and admins can see analytics.</p>}</div>}
    </div>
  );
}
