export interface BookmarkEntry {
  id: string;
  cfi: string;
  chapter: string;
  note: string;
  phrase: string;
  excerpt: string;
  createdAt: string | number;
}

export interface Lookup {
  term: string;
  context: string;
  translation?: string;
  definition?: string;
  example?: string;
  phonetic?: string;
  partOfSpeech?: string;
  synonyms?: string;
  lemma?: string;
  difficulty?: string;
  loading: boolean;
  alreadySaved?: boolean;
  bookmarkNote?: string;
  /** No hay clave de IA configurada: el popup explica cómo activarla. */
  missingAi?: boolean;
}

export type ReaderTheme = "dark" | "light" | "sepia";
export type FontFamily = "sans" | "serif" | "mono";
export type TextAlign = "left" | "justify" | "center" | "right";

export interface ReaderSettings {
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: number;
  textAlign: TextAlign;
  theme: ReaderTheme;
  marginH: number;
}

export interface ReaderThemeColors {
  bg: string;
  text: string;
  link: string;
  selection: string;
  selText: string;
}

export interface Chapter {
  label: string;
  href: string;
  depth: number;
  spineIndex: number;
}
