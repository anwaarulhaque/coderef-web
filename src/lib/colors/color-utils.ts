import type { ColorLocks, ColorPalette, ContrastScore } from "./types";

/** Strips # and cleans a hex string to 6 characters */
export function cleanHex(input: string, fallback = "000000"): string {
  if (!input) return fallback;
  let hex = input.trim().replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return fallback;
  }
  return hex.toLowerCase();
}

/** Formats hex with leading # */
export function formatHex(hex: string): string {
  return `#${cleanHex(hex)}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = cleanHex(hex);
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return [clamp(r), clamp(g), clamp(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("")
    .toLowerCase();
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = (h % 360 + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

/** Relative luminance formula conforming to WCAG 2.1 */
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/** Contrast ratio between two colors (1:1 to 21:1) */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getLuminance(hexA);
  const lumB = getLuminance(hexB);
  const brightest = Math.max(lumA, lumB);
  const darkest = Math.min(lumA, lumB);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export function evaluateContrast(hexA: string, hexB: string): ContrastScore {
  const ratio = getContrastRatio(hexA, hexB);
  let score: ContrastScore["score"] = "Fail";
  if (ratio >= 7) {
    score = "AAA";
  } else if (ratio >= 4.5) {
    score = "AA";
  } else if (ratio >= 3) {
    score = "AA Large";
  }
  return {
    ratio,
    score,
    isReadable: ratio >= 4.5,
  };
}

/** Checks whether a color is considered dark */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.28;
}

/** Inverts a palette between light and dark modes */
export function invertPalette(palette: ColorPalette): ColorPalette {
  const isDark = isDarkColor(palette.background);
  const bgHsl = rgbToHsl(...Object.values(hexToRgb(palette.background)) as [number, number, number]);
  const textHsl = rgbToHsl(...Object.values(hexToRgb(palette.text)) as [number, number, number]);
  const primHsl = rgbToHsl(...Object.values(hexToRgb(palette.primary)) as [number, number, number]);
  const secHsl = rgbToHsl(...Object.values(hexToRgb(palette.secondary)) as [number, number, number]);
  const accHsl = rgbToHsl(...Object.values(hexToRgb(palette.accent)) as [number, number, number]);

  if (isDark) {
    // Convert to light mode
    return {
      background: hslToHex(bgHsl.h, Math.min(bgHsl.s, 20), 98),
      text: hslToHex(textHsl.h, Math.min(textHsl.s, 20), 6),
      primary: hslToHex(primHsl.h, primHsl.s, Math.max(35, Math.min(50, primHsl.l - 10))),
      secondary: hslToHex(secHsl.h, Math.min(secHsl.s, 80), 92),
      accent: hslToHex(accHsl.h, accHsl.s, Math.max(40, Math.min(55, accHsl.l - 5))),
    };
  } else {
    // Convert to dark mode
    return {
      background: hslToHex(bgHsl.h, Math.min(bgHsl.s, 30), 6),
      text: hslToHex(textHsl.h, Math.min(textHsl.s, 15), 96),
      primary: hslToHex(primHsl.h, primHsl.s, Math.min(70, Math.max(55, primHsl.l + 10))),
      secondary: hslToHex(secHsl.h, Math.min(secHsl.s, 60), 18),
      accent: hslToHex(accHsl.h, accHsl.s, Math.min(75, Math.max(60, accHsl.l + 10))),
    };
  }
}

/** Generates Tailwind-style 50-900 shades for any color */
export function generateShades(hex: string): Record<string, string> {
  const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)) as [number, number, number]);
  const lightnessMap: Record<string, number> = {
    "50": 96,
    "100": 92,
    "200": 84,
    "300": 74,
    "400": 62,
    "500": l, // base
    "600": Math.max(10, l * 0.8),
    "700": Math.max(8, l * 0.65),
    "800": Math.max(6, l * 0.45),
    "900": Math.max(4, l * 0.3),
    "950": Math.max(2, l * 0.18),
  };

  const shades: Record<string, string> = {};
  for (const [shade, targetL] of Object.entries(lightnessMap)) {
    if (shade === "500") {
      shades[shade] = formatHex(hex);
    } else {
      shades[shade] = formatHex(hslToHex(h, s, Math.round(targetL)));
    }
  }
  return shades;
}

/** Generates a harmonious, high-quality modern palette respecting locked colors */
export function generateHarmoniousPalette(
  current: ColorPalette,
  locks: ColorLocks = {},
  preferDark?: boolean,
): ColorPalette {
  const willBeDark = preferDark !== undefined ? preferDark : isDarkColor(current.background);

  // Determine base hue from primary if locked, or random pleasant hue
  let primaryHue: number;
  if (locks.primary) {
    const { h } = rgbToHsl(...Object.values(hexToRgb(current.primary)) as [number, number, number]);
    primaryHue = h;
  } else {
    // Random hue (0-360)
    primaryHue = Math.floor(Math.random() * 360);
  }

  // Primary color saturation & lightness
  const primarySat = locks.primary
    ? rgbToHsl(...Object.values(hexToRgb(current.primary)) as [number, number, number]).s
    : 70 + Math.floor(Math.random() * 25);
  const primaryLight = locks.primary
    ? rgbToHsl(...Object.values(hexToRgb(current.primary)) as [number, number, number]).l
    : willBeDark ? 55 + Math.floor(Math.random() * 15) : 42 + Math.floor(Math.random() * 14);

  const primary = locks.primary ? current.primary : hslToHex(primaryHue, primarySat, primaryLight);

  // Background
  let background: string;
  if (locks.background) {
    background = current.background;
  } else if (willBeDark) {
    // Rich dark tint with subtle primary undertone
    const bgHue = (primaryHue + (Math.random() > 0.5 ? 10 : -10) + 360) % 360;
    const bgSat = 10 + Math.floor(Math.random() * 20);
    const bgLight = 4 + Math.floor(Math.random() * 6);
    background = hslToHex(bgHue, bgSat, bgLight);
  } else {
    // Crisp ultra-clean off-white with subtle tint
    const bgHue = (primaryHue + 20) % 360;
    const bgSat = Math.floor(Math.random() * 15);
    const bgLight = 97 + Math.floor(Math.random() * 2.5);
    background = hslToHex(bgHue, bgSat, bgLight);
  }

  // Text: Must contrast strongly against Background
  let text: string;
  if (locks.text) {
    text = current.text;
  } else if (willBeDark) {
    // Light text on dark bg
    const textHue = (primaryHue + 15) % 360;
    const textSat = 5 + Math.floor(Math.random() * 15);
    const textLight = 94 + Math.floor(Math.random() * 5);
    text = hslToHex(textHue, textSat, textLight);
  } else {
    // Deep dark text on light bg
    const textHue = primaryHue;
    const textSat = 10 + Math.floor(Math.random() * 20);
    const textLight = 4 + Math.floor(Math.random() * 6);
    text = hslToHex(textHue, textSat, textLight);
  }

  // Secondary: Harmonious tint or analog
  let secondary: string;
  if (locks.secondary) {
    secondary = current.secondary;
  } else {
    const secHueMode = Math.random();
    let secHue: number;
    if (secHueMode < 0.5) {
      // Monochromatic / soft tint of primary
      secHue = primaryHue;
    } else {
      // Analogous hue (+30 or -30)
      secHue = (primaryHue + (Math.random() > 0.5 ? 35 : -35) + 360) % 360;
    }

    if (willBeDark) {
      const secSat = Math.max(15, Math.min(45, primarySat - 20));
      const secLight = 14 + Math.floor(Math.random() * 12);
      secondary = hslToHex(secHue, secSat, secLight);
    } else {
      const secSat = Math.max(30, Math.min(85, primarySat - 10));
      const secLight = 88 + Math.floor(Math.random() * 7);
      secondary = hslToHex(secHue, secSat, secLight);
    }
  }

  // Accent: High-contrast pop / complement / triadic
  let accent: string;
  if (locks.accent) {
    accent = current.accent;
  } else {
    const accentMode = Math.random();
    let accentHue: number;
    if (accentMode < 0.45) {
      // Direct Complement (opposite side of wheel +180)
      accentHue = (primaryHue + 160 + Math.floor(Math.random() * 40)) % 360;
    } else if (accentMode < 0.75) {
      // Triadic (+120 or +240)
      accentHue = (primaryHue + (Math.random() > 0.5 ? 120 : 240)) % 360;
    } else {
      // High-energy vibrant analog or split
      accentHue = (primaryHue + (Math.random() > 0.5 ? 45 : -45) + 360) % 360;
    }

    const accSat = Math.min(100, Math.max(70, primarySat + 10));
    const accLight = willBeDark ? 60 + Math.floor(Math.random() * 15) : 48 + Math.floor(Math.random() * 14);
    accent = hslToHex(accentHue, accSat, accLight);
  }

  return {
    text: cleanHex(text),
    background: cleanHex(background),
    primary: cleanHex(primary),
    secondary: cleanHex(secondary),
    accent: cleanHex(accent),
  };
}

/** Parses query parameters like ?colors=050315-fbfbfe-2f27ce-dedcff-433bff&fonts=Inter-Inter */
export function parsePaletteFromSearch(search: string): { colors?: ColorPalette; fonts?: string } {
  if (!search) return {};
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  const colorsParam = params.get("colors");
  const fonts = params.get("fonts") ?? undefined;

  if (!colorsParam) return { fonts };

  const parts = colorsParam.split("-").map((p) => cleanHex(p, ""));
  if (parts.length >= 5 && parts.every((p) => p.length === 6)) {
    return {
      colors: {
        text: parts[0],
        background: parts[1],
        primary: parts[2],
        secondary: parts[3],
        accent: parts[4],
      },
      fonts,
    };
  }

  return { fonts };
}

/** Builds standard Realtime Colors search query string */
export function buildPaletteQuery(palette: ColorPalette, fontId?: string): string {
  const colorsStr = [
    cleanHex(palette.text),
    cleanHex(palette.background),
    cleanHex(palette.primary),
    cleanHex(palette.secondary),
    cleanHex(palette.accent),
  ].join("-");

  const params = new URLSearchParams();
  params.set("colors", colorsStr);
  if (fontId) {
    params.set("fonts", fontId);
  }
  return `?${params.toString()}`;
}

export function exportAsCss(p: ColorPalette): string {
  return `:root {
  --text: ${formatHex(p.text)};
  --background: ${formatHex(p.background)};
  --primary: ${formatHex(p.primary)};
  --secondary: ${formatHex(p.secondary)};
  --accent: ${formatHex(p.accent)};
}`;
}

export function exportAsTailwind(p: ColorPalette): string {
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        text: '${formatHex(p.text)}',
        background: '${formatHex(p.background)}',
        primary: '${formatHex(p.primary)}',
        secondary: '${formatHex(p.secondary)}',
        accent: '${formatHex(p.accent)}',
      },
    },
  },
};`;
}

export function exportAsScss(p: ColorPalette): string {
  return `$text: ${formatHex(p.text)};
$background: ${formatHex(p.background)};
$primary: ${formatHex(p.primary)};
$secondary: ${formatHex(p.secondary)};
$accent: ${formatHex(p.accent)};`;
}

export function exportAsJson(p: ColorPalette): string {
  return JSON.stringify(
    {
      text: formatHex(p.text),
      background: formatHex(p.background),
      primary: formatHex(p.primary),
      secondary: formatHex(p.secondary),
      accent: formatHex(p.accent),
    },
    null,
    2,
  );
}
