import type { Bundle, TranslationTree } from "./resources";
import { DEFAULT_NAMESPACE } from "./languages";

export interface TOptions {
  /** Valor para pluralización + interpolación de {{count}}. */
  count?: number;
  /** Cualquier otra variable a interpolar en {{variable}}. */
  [key: string]: string | number | undefined;
}

// Divide "ns:a.b.c" en { ns, path }. Sin prefijo → namespace por defecto.
function splitKey(
  key: string,
  defaultNs: string,
): { ns: string; path: string } {
  const idx = key.indexOf(":");
  if (idx === -1) return { ns: defaultNs, path: key };
  return { ns: key.slice(0, idx), path: key.slice(idx + 1) };
}

// Baja por "a.b.c" dentro de un árbol de traducciones.
function getNested(tree: TranslationTree | undefined, path: string): unknown {
  if (!tree) return undefined;
  return path
    .split(".")
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === "object"
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      tree,
    );
}

// Sustituye {{variable}} por su valor. No escapa: React ya lo hace al renderizar.
function interpolate(template: string, options?: TOptions): string {
  if (!options) return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const value = options[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

// Elige el sufijo de plural (_one, _other, _many…) según la lengua y el número.
// Usa Intl.PluralRules (nativo del navegador), sin librerías.
function pluralPath(path: string, count: number, language: string): string {
  let category: Intl.LDMLPluralRule;
  try {
    category = new Intl.PluralRules(language).select(count);
  } catch {
    category = count === 1 ? "one" : "other";
  }
  return `${path}_${category}`;
}

/**
 * Resuelve una clave contra el idioma activo, con fallback al idioma por
 * defecto. Devuelve la clave literal si no existe en ninguno (para que un
 * texto sin traducir "grite" en la UI en vez de romper).
 */
export function translate(
  key: string,
  options: TOptions | undefined,
  activeBundle: Bundle | undefined,
  fallbackBundle: Bundle,
  language: string,
  defaultNs: string = DEFAULT_NAMESPACE,
): string {
  const { ns, path } = splitKey(key, defaultNs);

  const lookup = (bundle: Bundle | undefined): string | undefined => {
    if (!bundle) return undefined;
    const tree = bundle[ns as keyof Bundle];
    // Con count, intenta primero la forma plural (path_one / path_other…).
    if (options && typeof options.count === "number") {
      const pluralValue = getNested(tree, pluralPath(path, options.count, language));
      if (typeof pluralValue === "string") return pluralValue;
    }
    const value = getNested(tree, path);
    return typeof value === "string" ? value : undefined;
  };

  const raw = lookup(activeBundle) ?? lookup(fallbackBundle);
  if (raw === undefined) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Clave sin traducción: "${key}"`);
    }
    return key;
  }
  return interpolate(raw, options);
}
