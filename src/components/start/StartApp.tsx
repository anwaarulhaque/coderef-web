"use client";

// The CodeRef Start app at /start/…, one static shell routed on the client:
//   /start/                 your pages (opens the last one; creates a starter page the first time)
//   /start/{pageId}/        a page                 /start/p/{shareId}/   a public page (read-only, copyable)
//   /start/connect/         connect the extension  /start/t/{slug}/      a team's home page
//   /start/join/?token=…    accept an invitation   /start/teams/(id/)    team list and admin
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError, openSignIn, useAccount } from "@/lib/account/client";
import { cache, isUuid, startApi, type StartPage, type TeamSummary } from "@/lib/start/client";
import { Board, PageShell } from "./Board";
import { ConnectPage } from "./Connect";
import { PageView, StartLogo } from "./PageView";
import { TeamAdmin, TeamsList } from "./Teams";
import { btn, btnPrimary, Icon, input } from "./ui";

const errText = (e: unknown, f: string) => (e instanceof ApiError ? e.message : f);

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-lg px-4 py-16 text-center">{children}</div>;
}

/** Full-screen layer above the site header and footer, like the start pages themselves. */
const Overlay = ({ children }: { children: React.ReactNode }) => <div className="fixed inset-0 z-40 overflow-y-auto bg-background">{children}</div>;

function SignInPrompt({ title, text }: { title: string; text: string }) {
  return (
    <Centered>
      <StartLogo href="/start-page/" />
      <h1 className="mt-6 text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">{text}</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" className={btnPrimary} onClick={() => openSignIn("Sign in or create a free account to use CodeRef Start.")}>
          Sign in or sign up free
        </button>
        <Link href="/start-page/" className={btn}>
          What is CodeRef Start?
        </Link>
      </div>
    </Centered>
  );
}

/** /start/: open the last page, or the first, or make a starter page for a brand-new user. */
function Home({ pages, loaded, onCreated }: { pages: StartPage[]; loaded: boolean; onCreated: (p: StartPage) => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const creating = useRef(false);
  useEffect(() => {
    if (!loaded || creating.current) return;
    const last = cache.get<string>("last");
    const target = pages.find((p) => p.id === last) ?? pages.find((p) => !p.teamId) ?? pages[0];
    if (target) {
      router.replace(`/start/${target.id}/`);
      return;
    }
    creating.current = true;
    startApi
      .createPage({ title: "Home", starter: true })
      .then((p) => {
        onCreated(p);
        router.replace(`/start/${p.id}/`);
      })
      .catch((e) => setError(errText(e, "Couldn't create your first page.")));
  }, [loaded, pages, router, onCreated]);
  return <Centered>{error ? <p className="text-red-600 dark:text-red-400">{error}</p> : <p className="text-muted">Opening your start page…</p>}</Centered>;
}

/** /start/p/{shareId}/: a read-only public page that anyone can copy to their own account. */
function PublicPage({ shareId }: { shareId: string }) {
  const { me } = useAccount();
  const router = useRouter();
  const [page, setPage] = useState<StartPage | null>(null);
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const load = (pw?: string) =>
    startApi
      .publicPage(shareId, pw)
      .then((p) => {
        setPage(p);
        setNeedPassword(false);
      })
      .catch((e) => {
        if (e instanceof ApiError && e.code === "password_required") {
          setNeedPassword(true);
          if (pw) setError(e.message);
        } else setError(errText(e, "This page isn't available."));
      });
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);
  if (needPassword)
    return (
      <Overlay>
        <Centered>
        <h1 className="text-xl font-semibold">This page is password protected</h1>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            void load(password);
          }}
        >
          <input type="password" autoFocus className={input} value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Password" />
          <button type="submit" className={btnPrimary}>
            Open
          </button>
        </form>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </Centered>
      </Overlay>
    );
  if (!page)
    return (
      <Overlay>
        <Centered>{error ? <p>{error}</p> : <p className="text-muted">Loading…</p>}</Centered>
      </Overlay>
    );
  const copy = async () => {
    if (!me?.user) return openSignIn("Sign in or create a free account to copy this page.");
    try {
      const r = await startApi.clone(shareId, password || undefined);
      router.push(`/start/${r.page.id}/`);
    } catch (e) {
      setError(errText(e, "Couldn't copy this page."));
    }
  };
  return (
    <PageShell page={page} ownCss={false}>
      <header className="flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="rounded-xl bg-surface/80 px-3 py-1.5 shadow-sm backdrop-blur">
          <StartLogo href="/start-page/" />
        </span>
        <h1 className="flex-1 rounded-xl bg-surface/80 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur">{page.title}</h1>
        <button type="button" onClick={copy} className={btnPrimary}>
          <Icon name="copy" size={14} /> Copy to my pages
        </button>
      </header>
      {error && <p className="mx-4 mb-3 rounded-lg bg-surface/90 px-3 py-2 text-sm">{error}</p>}
      <Board page={page} widgets={page.widgets ?? []} editing={false} canEdit={false} onWidget={() => undefined} onDelete={() => undefined} onLayout={() => undefined} onOpen={() => undefined} />
    </PageShell>
  );
}

/** /start/t/{slug}/: the team's home page for members; a join prompt for allowed domains. */
function TeamHome({ slug, pages, setPages }: { slug: string; pages: StartPage[]; setPages: (fn: (p: StartPage[]) => StartPage[]) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof startApi.teamBySlug>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () =>
    startApi
      .teamBySlug(slug)
      .then(setData)
      .catch((e) => setError(errText(e, "This team doesn't exist or you're not a member.")));
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  if (error || !data)
    return (
      <Overlay>
        <Centered>{error ?? "Loading…"}</Centered>
      </Overlay>
    );
  if (!data.member)
    return (
      <Overlay>
        <Centered>
          <h1 className="text-xl font-semibold">{data.team.name}</h1>
          <p className="mt-2 text-muted">{data.canJoin ? "Your email domain is allowed on this team." : "You need an invitation from a team admin to see these pages."}</p>
          {data.canJoin && (
            <button
              type="button"
              className={`${btnPrimary} mt-4`}
              onClick={async () => {
                try {
                  await startApi.joinTeam(slug);
                  setPages(() => []);
                  window.location.reload();
                } catch (e) {
                  setError(errText(e, "Couldn't join."));
                }
              }}
            >
              Join {data.team.name}
            </button>
          )}
        </Centered>
      </Overlay>
    );
  const home = data.team.defaultPageId ?? data.pages[0]?.id;
  if (!home)
    return (
      <Overlay>
        <Centered>This team has no pages yet.</Centered>
      </Overlay>
    );
  const all = pages.some((p) => p.id === home) ? pages : [...pages, ...data.pages];
  return <PageView pageId={home} pages={all} setPages={setPages} brandColor={data.team.brandColor} banner={data.team.announcement} />;
}

function JoinTeam() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") ?? "";
    startApi
      .acceptInvite(token)
      .then((r) => router.replace(`/start/t/${r.slug}/`))
      .catch((e) => setError(errText(e, "Couldn't accept the invitation.")));
  }, [router]);
  return <Centered>{error ? <p className="text-red-600 dark:text-red-400">{error}</p> : <p className="text-muted">Joining the team…</p>}</Centered>;
}

export function StartApp() {
  const pathname = usePathname();
  const seg = pathname.split("/").filter(Boolean).slice(1); // after "start"
  const { me, status } = useAccount();
  const user = me?.user;
  const [pages, setPagesState] = useState<StartPage[]>(() => cache.get<StartPage[]>("pages") ?? []);
  const [loaded, setLoaded] = useState(false);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const setPages = (fn: (p: StartPage[]) => StartPage[]) =>
    setPagesState((p) => {
      const next = fn(p);
      cache.set("pages", next);
      return next;
    });

  useEffect(() => {
    if (!user) return;
    startApi
      .pages()
      .then((p) => {
        setPagesState(p);
        cache.set("pages", p);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
    startApi
      .teams()
      .then(setTeams)
      .catch(() => undefined);
  }, [user]);

  // The page lives above the site header and footer (start pages are full screen).
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, []);

  const view = seg[0] === "p" && seg[1] ? <PublicPage shareId={seg[1]} /> : null;
  if (view) return view;

  if (status === "loading") return <div className="fixed inset-0 z-40 bg-background" />;
  if (!user)
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
        {seg[0] === "connect" ? (
          <ConnectPage />
        ) : seg[0] === "join" ? (
          <SignInPrompt title="You've been invited to a team" text="Sign in with the email address the invitation was sent to." />
        ) : (
          <SignInPrompt title="Your start page, everywhere" text="Bookmarks, feeds, notes, to-dos and more on one page that opens in every new tab. Free for up to 3 pages." />
        )}
      </div>
    );

  const overlay = (node: React.ReactNode) => <Overlay>{node}</Overlay>;
  if (!seg.length) return overlay(<Home pages={pages} loaded={loaded} onCreated={(p) => setPages((l) => [...l, p])} />);
  if (seg[0] === "connect") return overlay(<ConnectPage />);
  if (seg[0] === "join") return overlay(<JoinTeam />);
  if (seg[0] === "teams" && !seg[1]) return overlay(<TeamsList />);
  if (seg[0] === "teams" && seg[1] && isUuid(seg[1])) return overlay(<TeamAdmin teamId={seg[1]} />);
  if (seg[0] === "t" && seg[1]) return <TeamHome key={seg[1]} slug={seg[1]} pages={pages} setPages={setPages} />;
  if (isUuid(seg[0])) {
    const page = pages.find((p) => p.id === seg[0]);
    const team = page?.teamId ? teams.find((t) => t.id === page.teamId) : undefined;
    return <PageView key={seg[0]} pageId={seg[0]} pages={pages} setPages={setPages} brandColor={team?.brandColor} banner={team?.announcement} />;
  }
  return overlay(
    <Centered>
      <p>That page doesn&apos;t exist.</p>
      <Link href="/start/" className="mt-2 inline-block text-accent">
        Go to your pages
      </Link>
    </Centered>,
  );
}
