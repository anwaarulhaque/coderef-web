export type SheetItem = {
  name: string;
  url?: string;
};

/**
 * Live preview for a "visual" sheet group. Each item's `name` is a CSS snippet that is applied
 * to the demo container, or to child number `target` (0-based) when set.
 */
export type SheetDemo = {
  /** CSS always applied to the container, e.g. "display: grid; gap: 3px;". */
  base?: string;
  /** Number of child boxes (default 6). */
  items?: number;
  /** CSS applied to every child. */
  itemBase?: string;
  /** Extra CSS per child, by index. */
  itemStyles?: string[];
  target?: number;
};

export type SheetGroup = {
  title?: string;
  description?: string;
  url?: string;
  demo?: SheetDemo;
  items: SheetItem[];
};

export type SheetSection = {
  title: string;
  groups: SheetGroup[];
};

export type Sheet = {
  slug: string;
  title: string;
  category: string;
  description: string;
  color: string;
  reference?: string;
  /**
   * "links" = a resource page (official docs, external cheat sheets) rather than a full cheat sheet.
   * "visual" = every group has a `demo`, rendered as live previews of each CSS snippet.
   */
  kind?: "links" | "visual";
  sections: SheetSection[];
};

export type SheetSummary = Omit<Sheet, "sections"> & {
  itemCount: number;
};
