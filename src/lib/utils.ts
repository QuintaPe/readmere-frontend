export function cn(...inputs: (string | undefined | null | false | 0)[]) {
  return inputs.filter(Boolean).join(" ");
}

// Dispositivo táctil (dedo como puntero principal): mismo criterio que la
// variante CSS `touch:` de index.css. Constante de módulo: no cambia en vivo.
export const isTouchDevice =
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: coarse)").matches;
