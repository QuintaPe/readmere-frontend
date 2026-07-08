import { useCallback, useContext } from "react";

import { I18nContext } from "./I18nProvider";
import { translate, type TOptions } from "./translate";
import { DEFAULT_NAMESPACE, type Namespace } from "./languages";

export type TFunction = (key: string, options?: TOptions) => string;

export interface UseTranslationResult {
  t: TFunction;
  i18n: {
    language: string;
    /** Alias de `language` (compat con el patrón habitual de i18next). */
    resolvedLanguage: string;
    changeLanguage: (lng: string) => void;
    isLoading: boolean;
  };
}

/**
 * Hook de traducción propio (sin librerías). Todos los namespaces del idioma
 * activo están disponibles vía prefijo "ns:clave"; `ns` solo fija el namespace
 * por defecto para claves sin prefijo.
 */
export function useTranslation(
  ns?: Namespace | Namespace[],
): UseTranslationResult {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation debe usarse dentro de <I18nProvider>");
  }

  const { activeBundle, fallbackBundle, language, changeLanguage, isLoading } =
    ctx;
  const defaultNs = (Array.isArray(ns) ? ns[0] : ns) ?? DEFAULT_NAMESPACE;

  const t = useCallback<TFunction>(
    (key, options) =>
      translate(key, options, activeBundle, fallbackBundle, language, defaultNs),
    [activeBundle, fallbackBundle, language, defaultNs],
  );

  return {
    t,
    i18n: {
      language,
      resolvedLanguage: language,
      changeLanguage,
      isLoading,
    },
  };
}
