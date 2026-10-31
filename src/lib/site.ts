// The site map: one source for the header menus, the footer and the global search's "Pages" results.

export type NavItem = {
  href: string;
  label: string;
  description: string;
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type NavFeatured = {
  href: string;
  title: string;
  tagline: string;
  description: string;
  badge?: string;
  /** Button label (default "Launch Studio"). */
  cta?: string;
  /** The five dots on the card (default: the Realtime Colors palette). */
  swatches?: string[];
};

export type NavGroup = {
  label: string;
  href?: string;
  badge?: string;
  highlight?: boolean;
  featured?: NavFeatured;
  sections?: NavSection[];
  items?: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: "Design Systems",
    badge: "NEW",
    items: [
      { href: "/design-md/", label: "DESIGN.md Library", description: "1,000+ design systems for AI coding agents" },
      { href: "/design-md/?collection=top", label: "Top Brands", description: "Apple, Google, Stripe, Airbnb and other best-known brands" },
      { href: "/design-md/web/", label: "Web", description: "Design systems of well-known product and brand websites" },
      { href: "/design-md/brands/", label: "Brands", description: "Company design systems from around the world" },
      { href: "/design-md/mobile/", label: "Mobile Apps", description: "App design systems with SwiftUI, Android and Expo variants" },
      { href: "/design-md/indie/", label: "Indie & Portfolios", description: "Personal sites and portfolios with a distinctive look" },
      { href: "/backgrounds/", label: "Animated Backgrounds", description: "Copy-paste hero effects with custom colors and speed", badge: "NEW" },
    ],
  },
  {
    label: "CodeRef Start",
    badge: "NEW",
    featured: {
      href: "/start/",
      title: "CodeRef Start",
      tagline: "Your start page & new tab",
      description: "Bookmarks, feeds, notes, to-dos and 25 widgets on one page that opens in every new tab. Personal or shared with your team.",
      badge: "NEW",
      cta: "Open CodeRef Start",
      swatches: ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#0891b2"],
    },
    sections: [
      {
        title: "Product",
        items: [
          { href: "/start-page/", label: "Start Page Overview", description: "One page for everything you open every day" },
          { href: "/start-page/features/", label: "Start Page Features", description: "Widgets, themes, inbox, sharing, import and more" },
          { href: "/start-page/extension/", label: "New Tab Extension", description: "Your start page in every new tab, save tabs in one click" },
          { href: "/start-page/community/", label: "Template Gallery", description: "Start from pages the community has shared" },
        ],
      },
      {
        title: "Teams & Plans",
        items: [
          { href: "/start-page/teams/", label: "For Teams", description: "Shared, branded start pages and a team intranet" },
          { href: "/start-page/solutions/", label: "Start Solutions", description: "Education, enterprise, developers, agencies, remote teams" },
          { href: "/pricing/?product=start", label: "Start Pricing", description: "Free, PRO $24/year, Team $29/month, Enterprise" },
        ],
      },
    ],
  },
  {
    label: "Cheat Sheets & Reference",
    sections: [
      {
        title: "Cheat Sheets",
        items: [
          { href: "/", label: "All Cheat Sheets", description: "300+ languages, frameworks & libraries linked to official docs" },
          { href: "/javascript/", label: "JavaScript", description: "Array, String, Object, Promise, DOM and ESNext APIs" },
          { href: "/python/", label: "Python", description: "Built-ins, data structures, statements, and standard modules" },
          { href: "/git/", label: "Git Reference", description: "Everyday commands, branching, stashing, rebasing, and logs" },
        ],
      },
      {
        title: "Quick Reference",
        items: [
          { href: "/quick-reference/", label: "All Quick References", description: "Curated one-page syntax guides for 25+ technologies" },
          { href: "/quick-reference/vscode/", label: "VS Code Shortcuts", description: "Windows, Linux, and macOS productivity keybindings" },
          { href: "/quick-reference/bash/", label: "Bash & Shell", description: "Shell scripting, pipes, redirections, and command loops" },
          { href: "/quick-reference/csharp/", label: "C# / .NET", description: "Language syntax, LINQ, async/await, and collections" },
        ],
      },
      {
        title: "Web Standards & Compatibility",
        items: [
          { href: "/browser-support/", label: "Browser Support", description: "Baseline status & compatibility data for 1,200+ web features" },
          { href: "/browser-support/compare/", label: "Compare Browsers", description: "Side-by-side comparison of Chrome, Safari, and Firefox support" },
        ],
      },
      {
        title: "Learn Interactively",
        items: [
          { href: "/css-grid/", label: "CSS Grid", description: "Every grid property with live visual examples" },
          { href: "/flexbox/", label: "Flexbox", description: "Every flexbox property with live visual examples" },
          { href: "/git-branching/", label: "Git Branching", description: "Animated levels for branching, rebasing and remotes" },
        ],
      },
    ],
  },
  {
    label: "Tools & Studio",
    featured: {
      href: "/realtime-colors/",
      title: "Realtime Colors Studio",
      tagline: "Live Palette & UI Previewer",
      description: "Generate harmonious accessible palettes and preview in real time on authentic modern web apps, dashboards, and blogs.",
      badge: "NEW",
    },
    sections: [
      {
        title: "Compilers & Playgrounds",
        items: [
          { href: "/try-it/", label: "HTML, CSS & JS Playground", description: "All-in-one live web editor like Try It Yourself" },
          { href: "/html-editor/", label: "HTML Editor", description: "Live rendered HTML sandbox with instant preview" },
          { href: "/css-editor/", label: "CSS Editor", description: "Live style playground with flexbox & grid presets" },
          { href: "/javascript-compiler/", label: "JavaScript Compiler", description: "Run modern JS code with visual console output" },
          { href: "/rest-api-client/", label: "REST API Client", description: "Test HTTP requests and inspect responses like Postman" },
        ],
      },
      {
        title: "Developer Utilities",
        items: [
          { href: "/realtime-colors/", label: "Realtime Colors", description: "Color palette generator, contrast checker & template previewer", badge: "NEW" },
          { href: "/json-formatter/", label: "JSON Formatter", description: "Format, validate, repair, convert, and query JSON" },
          { href: "/markdown/", label: "Markdown Editor", description: "Live preview, table builder, and export to .md or .html" },
          { href: "/regex-tester/", label: "Regex Tester", description: "Real-time regex match tester, highlights & explanations" },
          { href: "/abbreviations/", label: "HTML & CSS Abbreviations", description: "Emmet syntax generator for rapid HTML authoring" },
        ],
      },
    ],
  },
];

/** Every destination in the menus, flattened (deduplicated by href). */
export const NAV_PAGES: NavItem[] = [
  ...new Map(
    NAV.flatMap((g) => {
      const all: NavItem[] = [];
      if (g.sections) {
        for (const sec of g.sections) {
          all.push(...sec.items);
        }
      }
      if (g.items) {
        all.push(...g.items);
      }
      if (g.href && !all.some((i) => i.href === g.href)) {
        all.push({ href: g.href, label: g.label, description: "" });
      }
      return all;
    }).map((i) => [i.href, i]),
  ).values(),
];
