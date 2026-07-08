// Navegar a un CFI dejando su frase cerca del BORDE SUPERIOR del viewport.
// El display() de epub.js (scrolled flow) deja el destino en cualquier parte
// —a menudo abajo—, así que tras display buscamos el elemento del DOM que
// contiene la frase y lo subimos, reintentando hasta que el capítulo carga.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function absTop(el: HTMLElement, body: HTMLElement): number {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n && n !== body) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

function alignPhraseTop(rendition: Any, needle: string): boolean {
  try {
    const mgr = rendition.manager;
    const container: HTMLElement | undefined = mgr?.container;
    const doc: Document | undefined =
      mgr?.views?._views?.[0]?.document ||
      (container?.querySelector("iframe") as HTMLIFrameElement | null)
        ?.contentDocument ||
      undefined;
    if (!container || !doc?.body || !needle) return false;
    const els = Array.from(
      doc.body.querySelectorAll<HTMLElement>(
        "mark, p, h1, h2, h3, h4, h5, h6, li, blockquote, td",
      ),
    );
    const target = els.find(
      (el) => el.offsetHeight > 0 && norm(el.textContent || "").includes(needle),
    );
    if (!target) return false;
    container.scrollTop = Math.max(0, absTop(target, doc.body) - 24);
    return true;
  } catch {
    return false;
  }
}

/**
 * display(cfi) + alineado de la frase con reintentos (~1 s máx.). Resuelve
 * cuando la frase quedó arriba o se agotaron los intentos; el llamante decide
 * qué ocultar/mostrar mientras tanto.
 */
export async function displayCfiAlignedTop(
  rendition: Any,
  cfi: string,
  phrase?: string,
): Promise<void> {
  const needle = phrase ? norm(phrase).slice(0, 40) : "";
  try {
    await rendition.display(cfi);
  } catch { /* seguir con el alineado aunque display falle */ }
  await new Promise<void>((resolve) => {
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      if (alignPhraseTop(rendition, needle) || tries >= 12) {
        clearInterval(id);
        resolve();
      }
    }, 90);
  });
}
