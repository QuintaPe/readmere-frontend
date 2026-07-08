import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export type ReaderPanel = "search" | "bookmarks" | "settings" | "toc";

export interface ReaderKeyActions {
  prevChapter(): void;
  nextChapter(): void;
  /** Abre el panel (cerrando los demás) o lo cierra si ya estaba abierto. */
  togglePanel(panel: ReaderPanel): void;
  toggleFullscreen(): void;
  exitFullscreen(): void;
}

// Un ÚNICO mapa de teclas para la ventana y para los iframes de los capítulos
// (antes había dos copias con pequeñas divergencias que ya habían empezado a
// separarse). Los eventos de un iframe no burbujean al window padre, por eso
// hay que engancharse en ambos sitios.
function handleReaderKey(e: KeyboardEvent, actions: ReaderKeyActions) {
  const ctrl = e.ctrlKey || e.metaKey;
  const tag = (e.target as HTMLElement | null)?.tagName;
  const inField = tag === "INPUT" || tag === "TEXTAREA";

  if (ctrl && e.key === "f") {
    e.preventDefault();
    actions.togglePanel("search");
    return;
  }
  if (ctrl && e.key === "d") {
    e.preventDefault();
    actions.togglePanel("bookmarks");
    return;
  }
  if (e.key === "F11" || (e.key === "f" && !ctrl && !e.altKey && !inField)) {
    e.preventDefault();
    actions.toggleFullscreen();
    return;
  }
  if (e.key === "Escape") {
    actions.exitFullscreen();
    return;
  }
  // Escribiendo en un campo (búsqueda, nota de marcador), las flechas mueven
  // el cursor: no deben cambiar de capítulo.
  if (inField) return;
  if (e.key === "ArrowLeft" && !ctrl) {
    actions.prevChapter();
    return;
  }
  if (e.key === "ArrowRight" && !ctrl) {
    actions.nextChapter();
  }
}

export function useReaderKeyboard(actions: ReaderKeyActions) {
  // Acciones siempre frescas sin re-registrar listeners (los de los iframes
  // no se pueden re-registrar fácilmente: viven en documentos de epub.js).
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handleReaderKey(e, actionsRef.current);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /**
   * Llamar en cada "rendered" de epub.js: engancha el mismo mapa de teclas
   * dentro de los iframes nuevos. Idempotente por iframe (flag __lcKeys).
   */
  const attachIframeKeys = useCallback((container: HTMLElement) => {
    try {
      const iframes = container.querySelectorAll<HTMLIFrameElement>("iframe");
      for (const iframe of iframes) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = iframe.contentWindow as any;
        if (!win || win.__lcKeys) continue;
        win.__lcKeys = true;
        win.addEventListener(
          "keydown",
          (e: KeyboardEvent) => handleReaderKey(e, actionsRef.current),
          { capture: true },
        );
      }
    } catch { /* noop */ }
  }, []);

  return { attachIframeKeys };
}
