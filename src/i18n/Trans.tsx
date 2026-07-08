import { cloneElement, Fragment, type ReactElement, type ReactNode } from "react";

import type { TFunction } from "./useTranslation";
import type { TOptions } from "./translate";

interface TransProps {
  /** Clave de traducción cuyo valor contiene markup: "texto <em>x</em> texto". */
  i18nKey: string;
  /** La `t` del hook (para respetar namespace por defecto e idioma activo). */
  t: TFunction;
  /** Mapa etiqueta → elemento React con el que envolver ese tramo. */
  components: Record<string, ReactElement>;
  /** Variables a interpolar ({{variable}}) antes de trocear el markup. */
  values?: TOptions;
}

// Trocea "a <em>b</em> c" en nodos, sustituyendo <tag>…</tag> por el componente
// correspondiente. Soporta un nivel de anidamiento (suficiente para textos de
// UI con énfasis); para casos más complejos, divídelos en varias claves.
function render(raw: string, components: Record<string, ReactElement>): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const [full, tag, inner] = match;
    if (match.index > lastIndex) {
      nodes.push(raw.slice(lastIndex, match.index));
    }
    const el = components[tag];
    nodes.push(
      el ? cloneElement(el, { key: key++ }, inner) : inner,
    );
    lastIndex = match.index + full.length;
  }
  if (lastIndex < raw.length) nodes.push(raw.slice(lastIndex));
  return nodes;
}

/**
 * Equivalente ligero de `<Trans>` de react-i18next para textos con markup
 * embebido, sin depender de ninguna librería.
 */
export function Trans({ i18nKey, t, components, values }: TransProps) {
  const raw = t(i18nKey, values);
  return <Fragment>{render(raw, components)}</Fragment>;
}
