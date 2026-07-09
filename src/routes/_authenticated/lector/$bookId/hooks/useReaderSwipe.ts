import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export interface ReaderSwipeActions {
  prevChapter(): void;
  nextChapter(): void;
}

// Un swipe horizontal claro cambia de capítulo; los verticales se dejan para el
// scroll nativo del lector. Los umbrales evitan disparar con toques sueltos o
// pequeños arrastres al seleccionar texto.
const MIN_X = 60; // px horizontales mínimos para contar como swipe
const MAX_MS = 600; // un swipe es rápido: descarta arrastres largos
const AXIS_RATIO = 1.5; // dx debe dominar claramente sobre dy

function detectSwipe(
  dx: number,
  dy: number,
  dt: number,
  actions: ReaderSwipeActions,
) {
  if (dt > MAX_MS) return;
  if (Math.abs(dx) < MIN_X) return;
  if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return; // fue scroll vertical
  // Deslizar hacia la derecha → capítulo anterior; hacia la izquierda → siguiente.
  if (dx > 0) actions.prevChapter();
  else actions.nextChapter();
}

export function useReaderSwipe(
  viewerRef: React.RefObject<HTMLElement | null>,
  actions: ReaderSwipeActions,
) {
  // Acciones siempre frescas sin re-enganchar listeners (los de los iframes
  // viven en documentos de epub.js y no se re-registran fácilmente).
  const actionsRef = useRef(actions);
  useLayoutEffect(() => {
    actionsRef.current = actions;
  });

  // Engancha el gesto a un objetivo (window de un iframe o el visor): guarda el
  // inicio del toque y evalúa el swipe al soltar. Devuelve una función de
  // limpieza.
  const bind = useCallback((target: Window | HTMLElement) => {
    let x = 0;
    let y = 0;
    let t = 0;
    let active = false;
    let fired = false; // ya se disparó el cambio de capítulo en este gesto
    // target es Window | HTMLElement: addEventListener no infiere TouchEvent en
    // esa unión, así que tipamos como Event y casteamos dentro.
    const onStart = (ev: Event) => {
      const e = ev as TouchEvent;
      if (e.touches.length !== 1) {
        active = false;
        return;
      }
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
      t = Date.now();
      active = true;
      fired = false;
    };
    // Detectamos el swipe en movimiento (no al soltar): en iOS un arrastre
    // horizontal sobre texto lo secuestra el navegador para SELECCIONAR y
    // emite `touchcancel` en vez de `touchend`, por lo que esperar a onEnd
    // nunca disparaba. En cuanto el eje X domina, cancelamos el gesto nativo
    // (preventDefault) y cambiamos de capítulo una sola vez.
    const onMove = (ev: Event) => {
      if (!active || fired) return;
      const touch = (ev as TouchEvent).touches[0];
      if (!touch) return;
      const dx = touch.clientX - x;
      const dy = touch.clientY - y;
      if (Math.abs(dx) < Math.abs(dy) * AXIS_RATIO) return; // gesto vertical → scroll nativo
      const e = ev as TouchEvent;
      if (e.cancelable) e.preventDefault(); // bloquea selección/scroll horizontal nativo
      if (Math.abs(dx) >= MIN_X && Date.now() - t <= MAX_MS) {
        fired = true;
        if (dx > 0) actionsRef.current.prevChapter();
        else actionsRef.current.nextChapter();
      }
    };
    const onEnd = (ev: Event) => {
      if (!active) return;
      active = false;
      if (fired) return; // ya lo resolvió onMove
      const touch = (ev as TouchEvent).changedTouches[0];
      if (!touch) return;
      detectSwipe(
        touch.clientX - x,
        touch.clientY - y,
        Date.now() - t,
        actionsRef.current,
      );
    };
    target.addEventListener("touchstart", onStart, { passive: true });
    // passive:false para poder preventDefault cuando el swipe es horizontal.
    target.addEventListener("touchmove", onMove, { passive: false });
    target.addEventListener("touchend", onEnd, { passive: true });
    // iOS emite touchcancel al tomar el control del gesto: lo tratamos igual.
    target.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      target.removeEventListener("touchstart", onStart);
      target.removeEventListener("touchmove", onMove);
      target.removeEventListener("touchend", onEnd);
      target.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  // Visor: zonas fuera del iframe (márgenes, huecos del layout).
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    return bind(el);
  }, [viewerRef, bind]);

  // Cada capítulo se renderiza en un iframe de epub.js cuyos eventos no burbujean
  // al padre: hay que enganchar el gesto dentro de cada uno. Idempotente por
  // iframe (flag __lcSwipe), igual que attachIframeKeys.
  const attachIframeSwipe = useCallback(
    (container: HTMLElement) => {
      try {
        const iframes =
          container.querySelectorAll<HTMLIFrameElement>("iframe");
        for (const iframe of iframes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const win = iframe.contentWindow as any;
          if (!win || win.__lcSwipe) continue;
          win.__lcSwipe = true;
          bind(win);
        }
      } catch {
        /* noop */
      }
    },
    [bind],
  );

  return { attachIframeSwipe };
}
