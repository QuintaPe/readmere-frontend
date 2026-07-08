// Idiomas EN LOS QUE está disponible la interfaz (locale de la UI).
//
// OJO: esto NO es el par de idiomas de estudio del perfil
// (nativeLanguage / targetLanguage). Aquello es "qué lees / qué aprendes";
// esto es "en qué idioma te habla la app". Son conceptos independientes.
//
// Para añadir un idioma nuevo a la interfaz basta con:
//   1. Añadir su entrada aquí.
//   2. Crear la carpeta src/i18n/locales/<code>/ con los mismos JSON que `es`.
// No hay que tocar ningún otro archivo de la aplicación.

export type Direction = "ltr" | "rtl";

export interface UiLanguage {
  code: string;
  /** Nombre del idioma en su propia lengua (endónimo). */
  label: string;
  flag: string;
  dir: Direction;
}

export const UI_LANGUAGES: readonly UiLanguage[] = [
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  // Ejemplos listos para el futuro (crear su carpeta de locales para activar):
  // { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  // { code: "de", label: "Deutsch",  flag: "🇩🇪", dir: "ltr" },
  // { code: "ar", label: "العربية",  flag: "🇸🇦", dir: "rtl" },
];

export const DEFAULT_LANGUAGE = "es";

export const SUPPORTED_LANGUAGE_CODES = UI_LANGUAGES.map((l) => l.code);

/** Idiomas de escritura de derecha a izquierda (para cuando se añadan). */
export const RTL_LANGUAGES = ["ar", "he", "fa", "ur", "ps", "dv"];

export function directionOf(langCode: string): Direction {
  const base = langCode.split("-")[0];
  return RTL_LANGUAGES.includes(base) ? "rtl" : "ltr";
}

/** Namespaces (un archivo JSON por namespace y por idioma). */
export const NAMESPACES = [
  "common", // botones, acciones y estados reutilizables en toda la app
  "nav", // navegación / sidebar
  "auth", // login, registro
  "settings", // ajustes
  "validation", // mensajes de validación de formularios
  "errors", // errores y páginas de error
] as const;

export type Namespace = (typeof NAMESPACES)[number];

/** Namespace usado cuando una clave no lleva prefijo "ns:". */
export const DEFAULT_NAMESPACE: Namespace = "common";
