export type ColorRole = "text" | "background" | "primary" | "secondary" | "accent";

export interface ColorPalette {
  text: string;
  background: string;
  primary: string;
  secondary: string;
  accent: string;
}

export type ColorLocks = {
  [K in ColorRole]?: boolean;
};

export interface FontPair {
  id: string;
  name: string;
  heading: string;
  body: string;
  googleFonts?: string;
  description: string;
}

export interface ColorPreset {
  id: string;
  name: string;
  category: "trending" | "dark" | "light" | "vibrant" | "minimal";
  colors: ColorPalette;
}

export interface ContrastScore {
  ratio: number;
  score: "AAA" | "AA" | "AA Large" | "Fail";
  isReadable: boolean;
}

export type TemplateView = "all" | "landing" | "dashboard" | "blog" | "components";
export type DeviceView = "desktop" | "tablet" | "mobile";
