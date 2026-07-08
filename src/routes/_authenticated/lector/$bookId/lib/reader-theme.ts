import type { ReaderSettings, ReaderTheme, FontFamily } from "@/types/reader";

export const FONT_MAP: Record<FontFamily, string> = {
  sans: "Outfit, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', Courier, monospace",
};

// Dark accent matches the platform indigo primary oklch(0.62 0.21 265) ≈ #5b7cff
export const THEMES: Record<
  ReaderTheme,
  { bg: string; text: string; link: string; selection: string; selText: string }
> = {
  dark: {
    bg: "#101119",
    text: "#eef0f6",
    link: "#5b7cff",
    selection: "#5b7cff",
    selText: "#0b1020",
  },
  light: {
    bg: "#ffffff",
    text: "#1a1a1a",
    link: "#0070f3",
    selection: "#0070f3",
    selText: "#ffffff",
  },
  sepia: {
    bg: "#f5efe6",
    text: "#4a3728",
    link: "#8b5e3c",
    selection: "#8b5e3c",
    selText: "#f5efe6",
  },
};

export function defaultSettings(): ReaderSettings {
  return {
    fontSize: 110,
    fontFamily: "sans",
    lineHeight: 1.8,
    textAlign: "left",
    theme: "dark",
    marginH: 8,
  };
}

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem("reader-settings-v2");
    if (raw) return { ...defaultSettings(), ...JSON.parse(raw) };
  } catch {
    /* noop */
  }
  return defaultSettings();
}

export function saveSettings(s: ReaderSettings) {
  localStorage.setItem("reader-settings-v2", JSON.stringify(s));
}

export function buildThemeObj(s: ReaderSettings) {
  const t = THEMES[s.theme];
  const font = FONT_MAP[s.fontFamily];
  const pad = `${s.marginH}%`;
  return {
    body: {
      background: `${t.bg} !important`,
      color: `${t.text} !important`,
      "font-family": `${font} !important`,
      "line-height": `${s.lineHeight} !important`,
      "text-align": `${s.textAlign} !important`,
      margin: "0 auto !important",
      padding: `20px ${pad} !important`,
      "box-sizing": "border-box !important",
      "max-width": "900px !important",
    },
    "p, div, li, td, th, blockquote": {
      "text-align": `${s.textAlign} !important`,
      "line-height": `${s.lineHeight} !important`,
    },
    p: { "margin-bottom": "0.8em !important" },
    "h1, h2, h3, h4, h5, h6": {
      "text-align": "left !important",
      color: `${t.text} !important`,
      "margin-top": "1.2em !important",
      "margin-bottom": "0.4em !important",
    },
    "img, svg, video": {
      "max-width": "100% !important",
      height: "auto !important",
    },
    "a[href]": { color: t.link },
    "a:not([href])": { color: "inherit" },
    "::selection": { background: t.selection, color: t.selText },
    "mark.lc-saved": {
      background: "rgba(91,124,255,0.25) !important",
      color: "inherit !important",
      "border-bottom": "2px solid #5b7cff !important",
      "border-radius": "2px",
      padding: "0 2px",
    },
    // Mastered ("known") words: calmer green so they recede vs. words in progress.
    "mark.lc-known": {
      background: "rgba(16,185,129,0.18) !important",
      "border-bottom": "2px solid #10b981 !important",
    },
    "mark.lc-bm-phrase": {
      background: "rgba(251,191,36,0.28) !important",
      color: "inherit !important",
      "border-bottom": "2px solid #f59e0b !important",
      "border-radius": "2px",
      padding: "0 2px",
    },
  };
}

// Delegado a la versión compartida, que usa audio de diccionario cuando existe.
