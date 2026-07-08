// Recursos del idioma POR DEFECTO (es). Se importan estáticamente para que
// entren en el bundle: primer render instantáneo, sin fetch ni parpadeo, y
// sirven de fallback cuando a otro idioma le falte una clave.
//
// Los idiomas ADICIONALES NO se importan aquí: viven en public/locales/<lng>/
// y se cargan de forma perezosa por HTTP (ver I18nProvider). Añadir un idioma =
// crear esa carpeta con los mismos JSON; no se toca este archivo.
import common from "./locales/es/common.json";
import nav from "./locales/es/nav.json";
import auth from "./locales/es/auth.json";
import settings from "./locales/es/settings.json";
import validation from "./locales/es/validation.json";
import errors from "./locales/es/errors.json";

import { DEFAULT_LANGUAGE, type Namespace } from "./languages";

/** Un objeto de traducciones puede anidarse arbitrariamente. */
export type TranslationTree = {
  [key: string]: string | TranslationTree;
};

export type Bundle = Record<Namespace, TranslationTree>;

// El español es la "fuente de verdad": la forma de estos objetos define qué
// claves existen (ver types.ts para el tipado de claves).
export const DEFAULT_BUNDLE = {
  common,
  nav,
  auth,
  settings,
  validation,
  errors,
} as const;

/** Resources iniciales en memoria: solo el idioma por defecto, ya cargado. */
export const INITIAL_RESOURCES: Record<string, Bundle> = {
  [DEFAULT_LANGUAGE]: DEFAULT_BUNDLE as unknown as Bundle,
};
