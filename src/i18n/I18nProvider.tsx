import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGE_CODES,
  NAMESPACES,
  directionOf,
} from "./languages";
import { INITIAL_RESOURCES, type Bundle } from "./resources";

/** Clave de localStorage donde se recuerda el idioma elegido. */
export const LANGUAGE_STORAGE_KEY = "ui_lang";

export interface I18nContextValue {
  /** Código del idioma activo (es, en…). */
  language: string;
  /** Cambia el idioma (carga perezosa si hace falta) y lo recuerda. */
  changeLanguage: (lng: string) => void;
  /** true mientras se descarga un idioma nuevo. */
  isLoading: boolean;
  /** Traducciones del idioma activo (puede faltar mientras carga). */
  activeBundle: Bundle | undefined;
  /** Traducciones del idioma por defecto: fallback siempre disponible. */
  fallbackBundle: Bundle;
}

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext<I18nContextValue | null>(null);

/** Normaliza "en-US" → "en" y valida contra los idiomas soportados. */
function normalize(code: string | null | undefined): string {
  const base = (code ?? "").split("-")[0].toLowerCase();
  return SUPPORTED_LANGUAGE_CODES.includes(base) ? base : DEFAULT_LANGUAGE;
}

// Idioma inicial: preferencia guardada → idioma del navegador → por defecto.
function detectInitialLanguage(): string {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) return normalize(stored);
  return normalize(navigator.language);
}

// Aplica el idioma al <html>: `lang` (accesibilidad / SEO) y `dir` (LTR/RTL).
// Esto es lo único necesario para que un idioma RTL herede el layout.
function applyDocumentLanguage(lng: string) {
  const el = document.documentElement;
  el.setAttribute("lang", lng);
  el.setAttribute("dir", directionOf(lng));
}

// Descarga los namespaces de un idioma desde public/locales/<lng>/<ns>.json.
// Un fetch por namespace, en paralelo y solo cuando el idioma se usa.
async function loadLanguage(lng: string): Promise<Bundle> {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const res = await fetch(`/locales/${lng}/${ns}.json`);
      if (!res.ok) {
        throw new Error(`[i18n] No se pudo cargar ${lng}/${ns}.json (${res.status})`);
      }
      return [ns, await res.json()] as const;
    }),
  );
  return Object.fromEntries(entries) as Bundle;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>(detectInitialLanguage);
  const [resources, setResources] =
    useState<Record<string, Bundle>>(INITIAL_RESOURCES);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  const changeLanguage = useCallback(
    (next: string) => {
      const base = normalize(next);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, base);

      // Ya cargado (o es el idioma por defecto empaquetado): cambio inmediato.
      if (resources[base]) {
        setLanguage(base);
        return;
      }
      // Idioma nuevo: se descarga y NO se cambia hasta tenerlo listo, para no
      // mostrar la UI a medio traducir durante el cambio interactivo.
      setIsLoading(true);
      loadLanguage(base)
        .then((bundle) => {
          setResources((prev) => ({ ...prev, [base]: bundle }));
          setLanguage(base);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    },
    [resources],
  );

  // Si el idioma inicial detectado no es el por defecto, cárgalo al montar.
  useEffect(() => {
    if (language !== DEFAULT_LANGUAGE && !resources[language]) {
      changeLanguage(language);
    }
    // Solo en el montaje: la detección inicial es un evento único.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      changeLanguage,
      isLoading,
      activeBundle: resources[language],
      fallbackBundle: resources[DEFAULT_LANGUAGE],
    }),
    [language, changeLanguage, isLoading, resources],
  );

  // El idioma por defecto está empaquetado → siempre listo (sin parpadeo).
  // Solo un idioma no-defecto elegido de inicio espera a su primera descarga.
  const ready = language === DEFAULT_LANGUAGE || Boolean(resources[language]);

  return (
    <I18nContext.Provider value={value}>
      {ready ? children : null}
    </I18nContext.Provider>
  );
}
