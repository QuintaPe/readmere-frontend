import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { fetchApi } from "@/lib/api";
import { bumpStudyToday } from "@/lib/streak";
import { getEpubFromCache, saveEpubToCache } from "../lib/epub-cache";
import { buildThemeObj, loadSettings } from "../lib/reader-theme";
import type { Chapter } from "@/types/reader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export interface EpubBookMeta {
  title: string;
  language: string;
  filePath: string;
  currentCfi: string | null;
  coverPath: string | null;
}

/**
 * Puntos de enganche para lo que NO es responsabilidad de este hook
 * (resaltados, popups, toolbar): el componente los implementa y el hook los
 * invoca en el momento adecuado. Se leen a través de un ref, así que pueden
 * cerrar sobre estado del componente sin re-montar el libro.
 */
export interface EpubBookEvents {
  /** Cada documento de capítulo recién renderizado (antes de mostrarse):
   * resaltados y listeners de click/selección del componente. */
  onContentDocument(doc: Document, win: Window): void;
  /** Cada "rendered" de epub.js (cambio de capítulo / reflow). */
  onRendered(): void;
  /** Tras cada relocated, con el índice del capítulo actual en el TOC plano. */
  onRelocated(chapterIdx: number): void;
}

interface UseEpubBookOptions {
  bookId: string | undefined;
  userId: string;
  viewerRef: React.RefObject<HTMLDivElement | null>;
  events: EpubBookEvents;
}

/**
 * Ciclo de vida completo del EPUB: metadata del libro, descarga con caché en
 * IndexedDB, montaje de epub.js, TOC aplanado, guardado de progreso con
 * debounce, detección de capítulo, precarga del siguiente y limpieza
 * (incluye sumar los minutos de lectura al salir).
 */
export function useEpubBook({ bookId, userId, viewerRef, events }: UseEpubBookOptions) {
  const [bookMeta, setBookMeta] = useState<EpubBookMeta | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState("");
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

  const renditionRef = useRef<Any>(null);
  const bookRef = useRef<Any>(null);
  // Copias en ref de chapters/currentChapterIdx para callbacks y rAF loops
  // que no deben re-crearse en cada render. El hook las mantiene en sincronía.
  const chaptersRef = useRef<Chapter[]>([]);
  const currentChapterIdxRef = useRef(0);
  const bookLanguageRef = useRef("en");
  const currentCfiRef = useRef("");
  const currentExcerptRef = useRef("");

  const saveProgressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPreloadedSpineIdx = useRef(-1);

  // Callbacks siempre frescos sin que el efecto de montaje dependa de ellos.
  const eventsRef = useRef(events);
  useLayoutEffect(() => {
    eventsRef.current = events;
  });

  // Scrollbars finas y sin overflow horizontal para los nodos que epub.js
  // crea fuera del alcance de nuestro CSS de Tailwind.
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "epub-overflow-fix";
    style.textContent = `
      .epub-container, .epub-view, .epub-view iframe { overflow-x: hidden !important; max-width: 100% !important; }
      .epub-container::-webkit-scrollbar { width: 6px !important; }
      .epub-container::-webkit-scrollbar-track { background: transparent !important; }
      .epub-container::-webkit-scrollbar-thumb { background: rgba(91,124,255,0.4) !important; border-radius: 999px !important; }
      .epub-container::-webkit-scrollbar-thumb:hover { background: rgba(91,124,255,0.7) !important; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const container = viewerRef.current;
    if (!container || !bookId) return;
    // Reloj de lectura por libro: se reinicia si se navega a otro bookId
    // (antes era un estado fijado en el primer montaje y el segundo libro
    // heredaba el tiempo del primero).
    const startedAt = Date.now();

    (async () => {
      const book = await fetchApi(`/books/${bookId}`).catch(() => null);
      if (!book) {
        setError("Libro no encontrado");
        toast.error("Libro no encontrado");
        return;
      }
      if (cancelled) return;
      setBookMeta({
        title: book.title,
        language: book.language || "en",
        filePath: book.filePath,
        currentCfi: book.currentCfi ?? null,
        coverPath: book.coverPath ?? null,
      });
      bookLanguageRef.current = book.language || "en";

      let buf = await getEpubFromCache(bookId);
      if (!buf || buf.byteLength === 0) {
        // URL firmada si el bucket es privado; la pública si no
        const { resolveEpubUrl } = await import("@/lib/supabase");
        const resp = await fetch(await resolveEpubUrl(book.filePath));
        if (!resp.ok) {
          setError("No se pudo cargar el archivo");
          toast.error("No se pudo cargar el archivo");
          return;
        }
        buf = await resp.arrayBuffer();
        await saveEpubToCache(bookId, buf.slice(0));
      }
      if (cancelled) return;

      const ePubModule = await import("epubjs");
      const ePub = (ePubModule as Any).default;
      const epubBook: Any = ePub(buf);
      bookRef.current = epubBook;

      const nav = await epubBook.loaded.navigation;
      await epubBook.loaded.spine;
      const flat: Chapter[] = [];
      const walk = (items: Any[], depth: number) => {
        for (const it of items || []) {
          const href: string = it.href || "";
          const base = href.split("#")[0];
          let spineIndex = -1;
          try {
            const sec = epubBook.spine.get(base);
            if (sec && typeof sec.index === "number") spineIndex = sec.index;
          } catch { /* noop */ }
          flat.push({ label: (it.label || "").trim() || "Capítulo", href, depth, spineIndex });
          if (it.subitems?.length) walk(it.subitems, depth + 1);
        }
      };
      walk(nav?.toc || [], 0);
      setChapters(flat);
      chaptersRef.current = flat;

      const cw = container.clientWidth || 800;
      const ch = container.clientHeight || 600;

      const rendition: Any = epubBook.renderTo(container, {
        width: cw,
        height: ch,
        spread: "none",
        flow: "scrolled",
        allowScriptedContent: false,
      });
      renditionRef.current = rendition;

      const s = loadSettings();
      rendition.themes.register("custom", buildThemeObj(s));
      rendition.themes.select("custom");
      rendition.themes.fontSize(`${s.fontSize}%`);

      // Un solo content hook: estilo base del documento + delegación al
      // componente (resaltados, clicks, selección, toolbar...).
      rendition.hooks.content.register((contents: Any) => {
        try {
          const doc: Document = contents.document;
          const fix = doc.createElement("style");
          fix.textContent = `
            html, body { overflow-x: hidden !important; max-width: 100% !important; scrollbar-width: thin; scrollbar-color: rgba(91,124,255,0.4) transparent; }
            html::-webkit-scrollbar, body::-webkit-scrollbar { width: 6px !important; }
            html::-webkit-scrollbar-track, body::-webkit-scrollbar-track { background: transparent !important; }
            html::-webkit-scrollbar-thumb, body::-webkit-scrollbar-thumb { background: rgba(91,124,255,0.4) !important; border-radius: 999px !important; }
            html::-webkit-scrollbar-thumb:hover, body::-webkit-scrollbar-thumb:hover { background: rgba(91,124,255,0.7) !important; }
            mark.lc-saved, mark.lc-bm-phrase { cursor: pointer !important; }
          `;
          doc.head.appendChild(fix);
          eventsRef.current.onContentDocument(doc, contents.window);
        } catch { /* noop */ }
      });

      let roTimer: ReturnType<typeof setTimeout> | undefined;
      const ro = new ResizeObserver(() => {
        clearTimeout(roTimer);
        // Debounce: reflow once the container stops changing size, not on every
        // intermediate frame of the sidebar animation.
        roTimer = setTimeout(() => {
          const w = container.clientWidth;
          const h = container.clientHeight;
          if (w > 0 && h > 0) {
            container.querySelectorAll<HTMLElement>(".epub-container, .epub-view, iframe").forEach((node) => {
              node.style.width = `${w}px`;
              if (node.tagName === "IFRAME") node.style.maxWidth = `${w}px`;
            });
            try { rendition.resize(w, h); } catch { /* noop */ }
          }
        }, 160);
      });
      ro.observe(container);
      (rendition as Any)._ro = ro;

      rendition.display(book.currentCfi || undefined);

      rendition.on("rendered", () => {
        const el = container.querySelector(".epub-container") as HTMLElement | null;
        if (el) {
          el.style.scrollbarWidth = "thin";
          el.style.scrollbarColor = "rgba(91,124,255,0.4) transparent";
        }
        eventsRef.current.onRendered();
      });

      rendition.on("relocated", async (location: Any) => {
        const cfi = location?.start?.cfi;
        const progress = location?.start?.percentage ?? 0;
        if (!cfi) return;
        currentCfiRef.current = cfi;
        try {
          const views = rendition.manager?.views?._views || [];
          if (views[0]) {
            const doc: Document = views[0]?.document || views[0]?.contents?.document;
            if (doc)
              currentExcerptRef.current = (doc.body.innerText || "").slice(0, 120).replace(/\s+/g, " ").trim();
          }
        } catch { /* noop */ }
        if (saveProgressTimer.current) clearTimeout(saveProgressTimer.current);
        saveProgressTimer.current = setTimeout(() => {
          fetchApi(`/books/${bookId}`, {
            method: "PUT",
            body: JSON.stringify({ currentCfi: cfi, progress, lastOpenedAt: new Date().toISOString() }),
          }).catch(() => { });
        }, 1500);

        const idx = location?.start?.index ?? 0;
        let bestIdx = -1;
        let best: Chapter | null = null;
        for (let i = 0; i < flat.length; i++) {
          const entry = flat[i];
          if (entry.spineIndex >= 0 && entry.spineIndex <= idx) {
            if (!best || entry.spineIndex >= best.spineIndex) { best = entry; bestIdx = i; }
          }
        }
        if (best) {
          setCurrentChapter(best.label);
          setCurrentChapterIdx(bestIdx);
          currentChapterIdxRef.current = bestIdx;
        } else if (flat[0]) {
          setCurrentChapter(flat[0].label);
          setCurrentChapterIdx(0);
          currentChapterIdxRef.current = 0;
        }

        eventsRef.current.onRelocated(bestIdx >= 0 ? bestIdx : 0);

        if (idx !== lastPreloadedSpineIdx.current) {
          lastPreloadedSpineIdx.current = idx;
          try {
            const nextItem = epubBook.spine.get(idx + 1);
            if (nextItem && !nextItem.loaded) {
              nextItem.load(epubBook.load.bind(epubBook)).catch(() => { });
            }
          } catch { /* noop */ }
        }
      });

      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (saveProgressTimer.current) clearTimeout(saveProgressTimer.current);
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      bumpStudyToday({ readingMinutes: minutes }).catch(() => { });
      const r = renditionRef.current as Any;
      try { r?._ro?.disconnect(); } catch { /* noop */ }
      try { bookRef.current?.destroy(); } catch { /* noop */ }
    };
    // viewerRef y events se leen vía ref; solo el libro (y el usuario del
    // cleanup) deben re-montar el EPUB.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, userId]);

  return {
    bookMeta,
    ready,
    error,
    chapters,
    currentChapter,
    currentChapterIdx,
    renditionRef,
    bookRef,
    chaptersRef,
    currentChapterIdxRef,
    bookLanguageRef,
    currentCfiRef,
    currentExcerptRef,
  };
}
