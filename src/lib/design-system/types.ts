export type ThemeName = "light" | "dark";

/** Where a value came from: read from the source file, computed from source values, or a CodeRef fallback. */
export type Provenance = "source" | "derived" | "default";

export type Sourced<T> = { value: T; from: Provenance };

export const ROLES = ["background", "surface", "foreground", "muted", "border", "primary", "onPrimary", "secondary", "accent"] as const;
export type Role = (typeof ROLES)[number];
export type ThemeTokens = Record<Role, Sourced<string>>;

export type TypeStyle = { name: string; fontFamily?: string; fontSize: string; fontWeight?: string; lineHeight?: string; letterSpacing?: string };
export type NamedValue = { name: string; value: string };
export type ComponentSpec = { name: string; backgroundColor?: string; textColor?: string; rounded?: string; padding?: string; typography?: string; border?: string };
export type PaletteColor = { name: string; hex: string };

/** Bucket counts of what was really found in the source (used to flag files without enough design information). */
export type Coverage = { colors: number; typography: number; rounded: number; spacing: number; shadows: number; components: number; breakpoints: number; principles: number };

export type DesignSystem = {
  id: string;
  slug: string;
  name: string;
  description: Sourced<string>;
  /** FNV-1a hash of the source text: the cache / invalidation key for generated output. */
  version: string;
  sourceFile: string;
  /** The theme the source is written for; the other theme is derived unless the source defines it. */
  sourceTheme: ThemeName;
  themes: Record<ThemeName, ThemeTokens>;
  palette: Sourced<PaletteColor[]>;
  fonts: { display: Sourced<string>; body: Sourced<string>; mono: Sourced<string> };
  typeScale: Sourced<TypeStyle[]>;
  radius: Sourced<NamedValue[]>;
  spacing: Sourced<NamedValue[]>;
  shadows: Sourced<NamedValue[]>;
  components: ComponentSpec[];
  breakpoints: Sourced<string[]>;
  principles: { items: Sourced<string[]>; dos: string[]; donts: string[] };
  coverage: Coverage;
  warnings: string[];
};

export type DesignMeta = { id: string; name?: string; summary?: string; colors?: string[]; fonts?: string[]; theme?: ThemeName; file?: string };

export type PackageFile = { name: string; mime: string; content: string };
