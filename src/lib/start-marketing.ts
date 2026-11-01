// Copy for the CodeRef Start marketing pages (/start-page/…): feature groups, solutions and FAQs. The plans and the
// widget list come from start-plans.ts so the pages never disagree with the product.

/** The Chrome Web Store listing; it also installs in Edge, Brave, Opera and Vivaldi. NEXT_PUBLIC_START_EXTENSION_URL overrides it. */
export const START_EXTENSION_URL =
  process.env.NEXT_PUBLIC_START_EXTENSION_URL || "https://chromewebstore.google.com/detail/cgnfgbgfdkjcmglffeonlhjigmfeglkb";

/** The Edge Add-ons listing. Until NEXT_PUBLIC_START_EDGE_URL is set, Edge visitors get the Chrome Web Store listing. */
export const START_EDGE_URL = process.env.NEXT_PUBLIC_START_EDGE_URL || START_EXTENSION_URL;

/** The Firefox Add-ons listing. Set NEXT_PUBLIC_START_FIREFOX_URL once it's approved; until then Firefox gets the home-page tip. */
export const START_FIREFOX_URL = process.env.NEXT_PUBLIC_START_FIREFOX_URL ?? "";

export type Feature = { title: string; text: string; tier?: "PRO" | "Team" | "Enterprise" };
export type FeatureGroup = { id: string; title: string; intro: string; features: Feature[] };

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: "pages",
    title: "Pages and layout",
    intro: "Organise your web into pages for work, home, research or clients, each with its own layout.",
    features: [
      { title: "Multiple start pages", text: "Three pages free, unlimited on PRO. Switch with the tabs or press 1–9." },
      { title: "1 to 5 columns", text: "Comfortable or compact spacing; the layout reflows on phones and tablets." },
      { title: "Drag and drop", text: "Move widgets between columns and reorder links inside a widget in edit mode." },
      { title: "Collapse and colour", text: "Fold away widgets you don't need right now, and colour-code the rest." },
      { title: "Duplicate pages", text: "Copy a page as the starting point for the next project." },
      { title: "Starter page", text: "New accounts start with a useful page instead of a blank screen." },
    ],
  },
  {
    id: "newtab",
    title: "New tab and browser extension",
    intro: "The CodeRef Start extension for Chrome, Edge and Brave makes your page the first thing every new tab shows.",
    features: [
      { title: "Your page in every new tab", text: "Pick which page opens. The last copy is cached, so it appears instantly, even offline." },
      { title: "Search or ask AI", text: "Google, DuckDuckGo or CodeRef, or ask ChatGPT, Claude, Perplexity, Copilot and more. Add any other in two fields." },
      { title: "Live sky and backgrounds", text: "A sky that follows the time of day, 22 photos, gradients or your own picture." },
      { title: "Most visited", text: "Your most visited sites as shortcuts under the search bar." },
      { title: "Command menu", text: "Ctrl K jumps to any page, any saved link, or asks AI about what you type." },
      { title: "Save this page", text: "One click saves the current tab to any list on any page." },
      { title: "Save all tabs", text: "Turn a window full of research into a list in one go." },
      { title: "Right-click to save", text: "Save any link or page from the context menu." },
      { title: "Inbox", text: "Saved links wait in your Inbox until you drag them where they belong.", tier: "PRO" },
      { title: "Address-bar search", text: "Type cr and a word in the address bar to search your bookmarks." },
      { title: "Tab sessions", text: "Save every open window and restore it later." },
      { title: "Keyboard shortcuts", text: "Save the current tab or open your start page without the mouse." },
    ],
  },
  {
    id: "widgets",
    title: "Widgets",
    intro: "Bookmarks are just the start. Every widget is listed below.",
    features: [],
  },
  {
    id: "search",
    title: "Search",
    intro: "Search the web, CodeRef or your own intranet from the page.",
    features: [
      { title: "Your engine", text: "Google, Bing, DuckDuckGo, GitHub, MDN, Stack Overflow or CodeRef." },
      { title: "Custom search", text: "Any site with a search URL, such as your intranet or wiki." },
      { title: "Press /", text: "Jump to the search box from anywhere on the page." },
    ],
  },
  {
    id: "themes",
    title: "Themes and backgrounds",
    intro: "Make it yours, from a calm solid colour to a moving background.",
    features: [
      { title: "Colours and gradients", text: "Ten presets designed to keep widgets readable." },
      { title: "Photo backgrounds", text: "Curated photos, or your own image on PRO.", tier: "PRO" },
      { title: "Animated backgrounds", text: "Effects from the CodeRef animated backgrounds library, paused when you're not looking." },
      { title: "Light, dark or automatic", text: "Follow your system, or fix a page to light or dark." },
      { title: "Fonts", text: "Sans, mono or serif." },
      { title: "Custom CSS", text: "Fine-tune every detail of a page.", tier: "PRO" },
    ],
  },
  {
    id: "sharing",
    title: "Sharing and templates",
    intro: "Share a page with a link, or publish it to the community gallery.",
    features: [
      { title: "Public links", text: "Anyone can view the page, read-only, and copy it to their own account." },
      { title: "Password protection", text: "Share privately with people who have the password.", tier: "PRO" },
      { title: "Template gallery", text: "Publish a page as a template, or start from one made by someone else." },
      { title: "View counts", text: "See how many people opened a shared page." },
    ],
  },
  {
    id: "import",
    title: "Import and export",
    intro: "Bring your bookmarks with you and take them anywhere. Nothing is locked in.",
    features: [
      { title: "Browser bookmarks", text: "One click in the extension, or upload the bookmarks file from any browser." },
      { title: "From start.me and others", text: "Their bookmark exports (HTML) import as pages, keeping your folders." },
      { title: "Feed lists (OPML)", text: "Import your feed reader's subscriptions as RSS widgets." },
      { title: "Export anytime", text: "Bookmarks HTML, Markdown or JSON." },
    ],
  },
  {
    id: "teams",
    title: "Teams and admin",
    intro: "Give everyone the same links, tools and news, with your branding.",
    features: [
      { title: "Shared team pages", text: "One workspace at coderef.xyz/start/t/your-team.", tier: "Team" },
      { title: "Roles", text: "Owners, admins, editors and viewers.", tier: "Team" },
      { title: "Branding", text: "Your logo and colour across every team page.", tier: "Team" },
      { title: "Announcements", text: "A banner every member sees, plus an announcement widget.", tier: "Team" },
      { title: "Join by email domain", text: "Colleagues with a company address join without an invite.", tier: "Team" },
      { title: "Default home page", text: "Choose the page members land on, and set it as their new tab.", tier: "Team" },
    ],
  },
  {
    id: "security",
    title: "Security and privacy",
    intro: "Built like the rest of CodeRef: as little data as possible, kept safe.",
    features: [
      { title: "Passwordless sign-in", text: "A one-time code by email. No password to leak." },
      { title: "Scoped extension tokens", text: "The extension's token only works for start pages and can be revoked any time." },
      { title: "Sandboxed widgets", text: "Embeds and custom HTML run in isolated frames that can't reach your account." },
      { title: "Single sign-on", text: "SAML and OIDC, with allowed domains.", tier: "Enterprise" },
      { title: "Managed rollout", text: "Push the extension and the team page with Chrome policies.", tier: "Enterprise" },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    intro: "See which links your team really uses, without tracking people.",
    features: [
      { title: "Link clicks", text: "Daily clicks over the last 30 days and the most-used links.", tier: "Team" },
      { title: "Page views", text: "Which team pages people open.", tier: "Team" },
      { title: "No personal tracking", text: "Counts only: no user, IP address or cookie is stored with a click." },
    ],
  },
];

export type Solution = { slug: string; title: string; tagline: string; intro: string; points: Feature[]; widgets: string[]; quote?: [string, string] };

export const START_SOLUTIONS: Solution[] = [
  {
    slug: "education",
    title: "Education",
    tagline: "One page for every class, tool and resource",
    intro: "Teachers share a class page with every link students need. Schools give staff one home for the LMS, timetable, email and policies.",
    points: [
      { title: "Class pages", text: "A page per class or course, shared with a link. Students copy it to their own account." },
      { title: "Fewer lost links", text: "Every tool in one place: the LMS, video calls, reading lists and assignments." },
      { title: "Calendars and countdowns", text: "Term dates, exam countdowns and the school calendar via ICS." },
      { title: "Staff intranet", text: "A team workspace for staff with announcements and a directory." },
    ],
    widgets: ["bookmarks", "calendar", "countdown", "announcement", "notes", "todo"],
  },
  {
    slug: "enterprise",
    title: "Enterprise intranet",
    tagline: "A lightweight intranet that people actually open",
    intro: "Make your intranet the new tab: every employee lands on the company apps, news and people they need, branded and managed by IT.",
    points: [
      { title: "Every new tab", text: "Roll out the extension with Chrome policy and set the team page as the new tab." },
      { title: "Company apps", text: "A branded launcher for HR, IT, finance and your own tools." },
      { title: "News and announcements", text: "Internal RSS feeds and a banner for what matters today." },
      { title: "Single sign-on and domains", text: "SSO, allowed email domains and admin roles on Enterprise." },
    ],
    widgets: ["apps", "announcement", "rss", "directory", "search", "ics"],
  },
  {
    slug: "developers",
    title: "Developers",
    tagline: "Your dev dashboard, in every new tab",
    intro: "Pin your repos, docs, CI dashboards and CodeRef cheat sheets next to the news you follow.",
    points: [
      { title: "Docs and cheat sheets", text: "The CodeRef cheat sheets widget puts 300+ references a click away." },
      { title: "GitHub activity", text: "Follow a repository or a teammate's public activity." },
      { title: "Dev news", text: "Hacker News, release notes and blogs merged into one feed." },
      { title: "Focus tools", text: "A Pomodoro timer, Kanban board and calculator built in." },
    ],
    widgets: ["cheatsheets", "github", "multirss", "kanban", "pomodoro", "speeddial"],
  },
  {
    slug: "agencies",
    title: "Agencies",
    tagline: "A page per client, shared with the whole team",
    intro: "Keep every client's dashboards, files and contacts on its own page, and hand clients a branded page of their own.",
    points: [
      { title: "Client pages", text: "One page per client with their tools, reports and contacts." },
      { title: "Share with clients", text: "A public link, optionally password protected, with everything they need." },
      { title: "Templates", text: "Start every new client from your house template." },
      { title: "Team roles", text: "Account managers edit; everyone else views." },
    ],
    widgets: ["speeddial", "bookmarks", "notes", "directory", "embed", "todo"],
  },
  {
    slug: "remote-teams",
    title: "Remote teams",
    tagline: "The office front door, for teams that don't share one",
    intro: "Give a distributed team one place to start the day: meeting links, rituals, time zones and the week's priorities.",
    points: [
      { title: "World clock", text: "Everyone's time zone at a glance." },
      { title: "Meeting links", text: "Stand-up, all-hands and office-hours links that never get lost in chat." },
      { title: "Weekly focus", text: "A shared Kanban board or notes for the team's priorities." },
      { title: "Onboarding", text: "A first-week page for new joiners with everything in order." },
    ],
    widgets: ["clock", "bookmarks", "kanban", "announcement", "directory", "notes"],
  },
];

export const START_FAQ: [string, string][] = [
  ["Is CodeRef Start part of CodeRef Pro?", "No. CodeRef Start is a separate product with its own plans. CodeRef Pro (cloud save and Design System exports) stays exactly as it is, and you can have either, both or neither."],
  ["Is there a free plan?", "Yes: up to 3 start pages, the essential widgets, the new-tab extension, sharing and the template gallery, free forever."],
  ["How does PRO cost $24 a year?", "Start PRO is billed once a year. That's $2 a month for unlimited pages, every widget, the inbox, custom backgrounds and CSS, and password-protected sharing."],
  ["How does the Team plan work?", "Start Team is $29 a month for one shared workspace with up to 20 members, all of whom get PRO. Add pages for the team, invite people by email or let your email domain join."],
  ["Which browsers does the extension support?", "Chrome, Edge, Brave and other Chromium browsers. In Firefox or Safari, set coderef.xyz/start/ as your home page."],
  ["Can I import from start.me or my browser?", "Yes. Upload a bookmarks export (HTML) from any browser or from start.me and it becomes a page with your folders as widgets. Feed readers' OPML files work too."],
  ["Can I cancel?", "Anytime, from Account → CodeRef Start. You keep your plan until the end of the period you paid for, and your pages stay; free limits apply again after that."],
  ["Who processes payments?", "Dodo Payments, our merchant of record, handles cards, local payment methods, sales tax and VAT."],
];

export const START_TEAM_FAQ: [string, string][] = [
  ["Do members need to pay?", "No. The team plan covers up to 20 members, and every member gets PRO features while they're on the team."],
  ["Can members have personal pages too?", "Yes. Team pages appear next to each member's own pages; personal pages stay private."],
  ["How do we make it everyone's new tab?", "Members install the CodeRef Start extension and pick the team page. IT can push the extension with Chrome's ExtensionInstallForcelist policy and set the team in the extension's managed policy."],
  ["What does Enterprise add?", "Unlimited teams and members, single sign-on, managed rollout, advanced analytics, invoicing and a dedicated contact. Email us for a quote."],
];
