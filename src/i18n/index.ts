// API pública del i18n propio (sin librerías externas).
export { I18nProvider, LANGUAGE_STORAGE_KEY } from "./I18nProvider";
export { useTranslation, type TFunction } from "./useTranslation";
export { Trans } from "./Trans";
export type { TOptions } from "./translate";
export {
  UI_LANGUAGES,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES,
  RTL_LANGUAGES,
  directionOf,
  NAMESPACES,
  type UiLanguage,
  type Namespace,
  type Direction,
} from "./languages";
