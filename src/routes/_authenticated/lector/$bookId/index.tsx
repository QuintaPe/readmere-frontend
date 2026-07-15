import { useAuth } from "@/auth/auth-context";
import { useSidebar } from "@/components/ui/sidebar";
import { Link, useParams, useLocation, useOutletContext } from "react-router-dom";
import type { ProtectedOutletContext } from "@/routes/_authenticated/route";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { useAudioCursor } from "./hooks/useAudioCursor";
import { useFollowScroll } from "./hooks/useFollowScroll";
import { useAudioChapterMapping } from "./hooks/useAudioChapterMapping";
import { useAudioEpubSync } from "./hooks/useAudioEpubSync";
import { useBookmarks } from "./hooks/useBookmarks";
import { useSavedWordHighlights } from "./hooks/useSavedWordHighlights";
import { useWordLookup } from "./hooks/useWordLookup";
import { useEpubSearch } from "./hooks/useEpubSearch";
import { useEpubBook } from "./hooks/useEpubBook";
import { useReaderKeyboard, type ReaderPanel } from "./hooks/useReaderKeyboard";
import { useReaderSwipe } from "./hooks/useReaderSwipe";
import { Button } from "@/components/ui/button";
import { Loader2, Locate, BookOpen } from "lucide-react";

import { highlightPhrasesInDoc } from "./lib/epub-highlight";
import { displayCfiAlignedTop } from "./lib/epub-navigation";
import { audiobookKeys } from "./lib/audiobook-keys";
import {
  THEMES,
  buildThemeObj,
  loadSettings,
  saveSettings,
} from "./lib/reader-theme";
import type { ReaderSettings } from "@/types/reader";

import ReaderToolbar from "./components/ReaderToolbar";
import SearchPanel from "./components/SearchPanel";
import BookmarkPanel from "./components/BookmarkPanel";
import TocPanel from "./components/TocPanel";
import SettingsPanel from "./components/SettingsPanel";
import AddBookmarkDialog from "./components/AddBookmarkDialog";
import WordLookupPopup from "./components/WordLookupPopup";
import AudiobookPlayer from "./components/AudiobookPlayer";
import AudiobookMode from "./components/AudiobookMode";
import { useAudiobook } from "./hooks/useAudiobook";
import { useSleepTimer, sleepTimerLabel } from "./hooks/useSleepTimer";
import { useIsPhone } from "@/hooks/use-mobile";

export default function Reader() {
  const { bookId } = useParams();
  const { user } = useAuth();
  const isPhone = useIsPhone();

  // La Biblioteca pasa la portada por `state` para que esté disponible en el
  // primer render y el shared-element (`book-cover-<id>`) case sin esperar al
  // fetch de metadatos. Fallback a lo que devuelva useEpubBook.
  const navState = useLocation().state as
    | { coverPath?: string | null; title?: string }
    | null;

  const viewerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);

  const [toolbarVisible, setToolbarVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const { setChromeHidden } = useOutletContext<ProtectedOutletContext>();
  const bookmarkJumpingRef = useRef(false);

  // Todo el ciclo de vida del EPUB (metadata, caché, epub.js, progreso,
  // capítulos) vive en useEpubBook; el componente aporta lo suyo —resaltados,
  // popups, toolbar— a través de estos tres callbacks.
  const {
    bookMeta, ready, error, chapters, currentChapter, currentChapterIdx,
    renditionRef, bookRef, chaptersRef, currentChapterIdxRef,
    bookLanguageRef, currentCfiRef, currentExcerptRef,
  } = useEpubBook({
    bookId,
    userId: user.id,
    viewerRef,
    events: {
      onContentDocument: (doc, win) => handleContentDocument(doc, win),
      onRendered: () => handleRendered(),
      onRelocated: (idx) => { injectAbsorbed(idx).catch(() => { }); },
    },
  });

  // Vocabulario guardado del idioma del libro + resaltados en el texto.
  const {
    savedTermsRef, savedWordsDataRef,
    highlightSavedInDoc, rehighlightAll,
  } = useSavedWordHighlights({ renditionRef, bookMeta });

  const { state: audiobookState, controls: audiobookControls } = useAudiobook(bookId);
  const sleepTimer = useSleepTimer(audiobookState, audiobookControls);
  const [audioScrollSync, setAudioScrollSync] = useState(true);
  // Derivado: si se desvincula el audiolibro, el modo solo audio cae con él.
  const audioOnly = audioOnlyMode && audiobookState.hasFile;

  // En pantalla completa (y en modo solo audiolibro) ocultamos la cabecera y
  // el sidebar del layout (si no, se pintan por encima del lector). Al
  // desmontar, restauramos el chrome.
  useEffect(() => {
    setChromeHidden(fullscreen || audioOnly);
    return () => setChromeHidden(false);
  }, [fullscreen, audioOnly, setChromeHidden]);
  const {
    followScroll, followScrollRef,
    suppressScrollUntilRef, lastTargetYRef, lastAutoScrollTopRef,
    handleFollowClick,
  } = useFollowScroll({ hasFile: audiobookState.hasFile, renditionRef, viewerRef });

  const themeLinkColorRef = useRef("#5b7cff");
  const [cursorOffset, setCursorOffset] = useState(0);
  const cursorOffsetRef = useRef(0);
  useLayoutEffect(() => { cursorOffsetRef.current = cursorOffset; }, [cursorOffset]);

  // Load saved cursor offset when chapter changes
  const chapterOffsetKey = bookId
    ? audiobookKeys(bookId).cursorOffset(audiobookState.currentChapterIdx)
    : null;
  useEffect(() => {
    if (!chapterOffsetKey) return;
    const saved = parseFloat(localStorage.getItem(chapterOffsetKey) ?? "");
    setTimeout(() => setCursorOffset(isNaN(saved) ? 0 : saved), 0);
  }, [chapterOffsetKey]);

  function adjustCursorOffset(delta: number) {
    setCursorOffset((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      if (chapterOffsetKey) localStorage.setItem(chapterOffsetKey, String(next));
      return next;
    });
  }

  // --- Bookmark highlight helpers ---
  function applyBookmarkAnnotations() {
    const r = renditionRef.current;
    if (!r) return;
    const bms = bookmarksRef.current;
    try {
      for (const bm of bms) {
        try { r.annotations.remove(bm.cfi, "highlight"); } catch { /* noop */ }
      }
      for (const bm of bms) {
        r.annotations.add("highlight", bm.cfi, { id: bm.id }, undefined, "lc-bookmark-hl", {
          fill: "#f59e0b",
          "fill-opacity": "0.22",
          "mix-blend-mode": "normal",
        });
      }
    } catch { /* noop */ }
  }

  function rehighlightBookmarkPhrases() {
    const r = renditionRef.current;
    if (!r) return;
    try {
      const views = r.manager?.views?._views || [];
      for (const v of views) {
        const doc: Document | undefined = v?.document || v?.contents?.document;
        if (doc) {
          doc.querySelectorAll("mark.lc-bm-phrase").forEach((m) => {
            const t = doc.createTextNode(m.textContent || "");
            m.parentNode?.replaceChild(t, m);
          });
          highlightPhrasesInDoc(doc, bookmarkPhrasesRef.current);
        }
      }
    } catch { /* noop */ }
  }

  // --- Hooks ---
  const { searchResults, searchLoading, runSearch } = useEpubSearch({ bookRef, chaptersRef });

  const {
    bookmarks, bookmarksRef, bookmarkPhrasesRef,
    showBookmarks, setShowBookmarks,
    showAddBookmark, setShowAddBookmark,
    bookmarkNote, setBookmarkNote,
    bookmarkPhrase, setBookmarkPhrase,
    addBookmark, deleteBookmark,
  } = useBookmarks({
    bookId,
    renditionRef,
    currentCfiRef,
    currentExcerptRef,
    currentChapter,
    applyBookmarkAnnotations,
    rehighlightBookmarkPhrases,
  });

  const {
    chapterMappingLoading, aiChapterTitles, a2eRef, e2aRef,
    injectAbsorbed, resetMapping,
  } = useAudioChapterMapping({
    bookId,
    audiobookChapters: audiobookState.chapters,
    chapters,
    chaptersRef,
    renditionRef,
    bookRef,
    currentChapterIdxRef,
  });

  const { lookup, setLookup, openLookup, saveWord } = useWordLookup({
    bookId,
    renditionRef,
    savedTermsRef,
    savedWordsDataRef,
    bookLanguageRef,
    bookmarkPhrasesRef,
    bookLanguage: bookMeta?.language,
    rehighlightAll,
  });

  // Stable refs for the rAF loop
  const audiobookStateRef = useRef(audiobookState);
  const audiobookControlsRef = useRef(audiobookControls);
  const audioScrollSyncRef = useRef(audioScrollSync);
  useLayoutEffect(() => {
    audiobookStateRef.current = audiobookState;
    audiobookControlsRef.current = audiobookControls;
    audioScrollSyncRef.current = audioScrollSync;
  });

  useAudioCursor({
    hasFile: audiobookState.hasFile,
    renditionRef,
    viewerRef,
    audiobookStateRef,
    audiobookControlsRef,
    audioScrollSyncRef,
    cursorOffsetRef,
    themeLinkColorRef,
    followScrollRef,
    suppressScrollUntilRef,
    lastTargetYRef,
    lastAutoScrollTopRef,
  });

  // Capítulo de audio ↔ capítulo del EPUB, en ambos sentidos y sin eco.
  useAudioEpubSync({
    audiobookState, audiobookControls,
    chapters, chaptersRef, renditionRef,
    currentChapterIdx, a2eRef, e2aRef,
  });

  function toggleFullscreen() {
    setFullscreen((s) => !s);
    setToolbarVisible(true);
  }

  // Abre un panel cerrando los demás, o lo cierra si ya estaba abierto.
  // Lo usan la toolbar y los atajos de teclado (antes: 8 closures repetidas).
  const togglePanel = useCallback((panel: ReaderPanel) => {
    setShowSearch((s) => (panel === "search" ? !s : false));
    setShowBookmarks((s) => (panel === "bookmarks" ? !s : false));
    setShowSettings((s) => (panel === "settings" ? !s : false));
    setShowToc((s) => (panel === "toc" ? !s : false));
  }, [setShowBookmarks]);

  const { state: sidebarState } = useSidebar();
  useEffect(() => {
    const r = renditionRef.current;
    const el = viewerRef.current;
    if (!r || !el) return;
    // The sidebar animates the container width. Resizing epub.js on every frame
    // makes it reflow the whole document repeatedly (the "jerks"), so instead we
    // reflow ONCE after the animation settles. CSS (max-width:100% on the epub
    // nodes) keeps the content fitting horizontally during the animation.
    const id = setTimeout(() => {
      try {
        const w = el.clientWidth;
        const h = el.clientHeight;
        el.querySelectorAll<HTMLElement>(".epub-container, .epub-view, iframe").forEach((node) => {
          node.style.width = `${w}px`;
          if (node.tagName === "IFRAME") node.style.maxWidth = `${w}px`;
        });
        r.resize(w, h);
      } catch { /* noop */ }
    }, 320);
    return () => clearTimeout(id);
    // Los paneles acoplados (lg) encogen el visor: hay que reflow-ar epub.js
    // igual que al animar el sidebar. En overlay (<lg) el visor no cambia de
    // ancho, así que este resize es un no-op inofensivo.
  }, [sidebarState, fullscreen, renditionRef, showSearch, showBookmarks, showSettings, showToc]);

  function applySettings(s: ReaderSettings) {
    const r = renditionRef.current;
    if (!r) return;
    try {
      r.themes.register("custom", buildThemeObj(s));
      r.themes.select("custom");
      r.themes.fontSize(`${s.fontSize}%`);
    } catch { /* noop */ }
  }

  function updateSettings(patch: Partial<ReaderSettings>) {
    setSettings((cur) => {
      const next = { ...cur, ...patch };
      saveSettings(next);
      applySettings(next);
      return next;
    });
  }

  // Fundido común a TODO cambio de capítulo (con o sin audiolibro): oscurece el
  // visor, ejecuta la acción tras el fade-out y deja que el evento "rendered"
  // reponga la opacidad. Red de seguridad por si "rendered" no llega (p. ej. un
  // capítulo de audio que cae en el mismo capítulo del EPUB): repone igualmente.
  const withChapterTransition = useCallback((action: () => void) => {
    setTransitioning(true);
    setTimeout(() => {
      action();
      setTimeout(() => setTransitioning(false), 450);
    }, 250);
  }, []);

  const navigateChapter = useCallback((href: string) => {
    withChapterTransition(() => renditionRef.current?.display(href));
  }, [withChapterTransition, renditionRef]);

  // When audiobook is active with chapters, it becomes the primary navigation
  const audioActive = audiobookState.hasFile && audiobookState.chapters.length > 0;

  const prevChapter = useCallback(() => {
    if (audioActive) {
      withChapterTransition(() =>
        audiobookControls.goToChapter(
          Math.max(0, audiobookState.currentChapterIdx - 1),
        ),
      );
      return;
    }
    const chs = chaptersRef.current;
    const idx = currentChapterIdxRef.current;
    const next = Math.max(0, idx - 1);
    if (chs[next]) navigateChapter(chs[next].href);
  }, [navigateChapter, withChapterTransition, audioActive, audiobookState.currentChapterIdx, audiobookControls, chaptersRef, currentChapterIdxRef]);

  const nextChapter = useCallback(() => {
    if (audioActive) {
      withChapterTransition(() =>
        audiobookControls.goToChapter(
          Math.min(
            audiobookState.chapters.length - 1,
            audiobookState.currentChapterIdx + 1,
          ),
        ),
      );
      return;
    }
    const chs = chaptersRef.current;
    const idx = currentChapterIdxRef.current;
    const next = Math.min(chs.length - 1, idx + 1);
    if (chs[next]) navigateChapter(chs[next].href);
  }, [navigateChapter, withChapterTransition, audioActive, audiobookState.currentChapterIdx, audiobookState.chapters.length, audiobookControls, chaptersRef, currentChapterIdxRef]);

  // Mismo mapa de teclas para window y para los iframes de los capítulos.
  const { attachIframeKeys } = useReaderKeyboard({
    prevChapter,
    nextChapter,
    togglePanel,
    toggleFullscreen,
    exitFullscreen: () => setFullscreen(false),
  });

  // En táctil (iPad/móvil): deslizar horizontalmente cambia de capítulo.
  const { attachIframeSwipe } = useReaderSwipe(viewerRef, {
    prevChapter,
    nextChapter,
  });

  // Por cada documento de capítulo que epub.js renderiza: resaltados de
  // palabras guardadas y frases de marcadores, click para reabrir el popup,
  // selección de texto → lookup, y auto-ocultado de la toolbar al hacer scroll.
  function handleContentDocument(doc: Document, win: Window) {
    highlightSavedInDoc(doc);
    highlightPhrasesInDoc(doc, bookmarkPhrasesRef.current);

    doc.addEventListener("click", (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("lc-saved")) {
        e.stopPropagation();
        const term = target.textContent?.trim() ?? "";
        const word = savedWordsDataRef.current.find(
          (w) => w.term.toLowerCase() === term.toLowerCase(),
        );
        if (word) {
          setLookup({
            term: word.term,
            context: "",
            translation: word.translation,
            definition: word.definition,
            example: word.example,
            phonetic: word.phonetic,
            partOfSpeech: word.partOfSpeech,
            synonyms: word.synonyms,
            loading: false,
            alreadySaved: true,
          });
        }
      } else if (target.classList.contains("lc-bm-phrase")) {
        e.stopPropagation();
        const phrase = target.textContent?.trim() ?? "";
        const bm = bookmarksRef.current.find(
          (b) => b.phrase?.toLowerCase() === phrase.toLowerCase(),
        );
        if (bm) {
          setLookup({
            term: phrase,
            context: bm.excerpt ?? "",
            definition: bm.note || undefined,
            loading: false,
            alreadySaved: true,
            bookmarkNote: bm.note ?? "",
          });
        }
      }
    });

    const handleSelection = () => {
      const sel = win.getSelection();
      const text = sel?.toString().trim() ?? "";
      if (!text || text.length < 2 || text.length > 80 || /\s{2,}/.test(text)) return;
      const range = sel?.getRangeAt(0);
      let context = "";
      if (range) {
        const para = (range.startContainer as Node).parentElement?.textContent ?? "";
        context = para.slice(0, 400);
      }
      openLookup(text, context, bookLanguageRef.current);
      sel?.removeAllRanges();
    };

    // Escritorio: al soltar el ratón, inmediato.
    doc.addEventListener("mouseup", handleSelection);

    // Táctil (iPad/móvil): iOS no emite un `mouseup` fiable al terminar una
    // selección con las asas nativas, así que escuchamos `selectionchange` con
    // debounce (se dispara al asentarse la selección, no mientras se arrastra).
    // Sólo para toque/lápiz: en ratón ya lo cubre `mouseup`, y así evitamos que
    // el popup salte a media selección de escritorio.
    let touchSelecting = false;
    doc.addEventListener("pointerdown", (e: PointerEvent) => {
      touchSelecting = e.pointerType === "touch" || e.pointerType === "pen";
    }, { passive: true });
    let selTimer: ReturnType<typeof setTimeout> | undefined;
    doc.addEventListener("selectionchange", () => {
      if (!touchSelecting) return;
      clearTimeout(selTimer);
      selTimer = setTimeout(handleSelection, 450);
    });

    win.addEventListener("scroll", () => {
      const y = win.scrollY ?? 0;
      const prev = lastScrollYRef.current;
      if (y > prev + 8) setToolbarVisible(false);
      else if (y < prev - 8) setToolbarVisible(true);
      lastScrollYRef.current = y;
    }, { passive: true });
    doc.addEventListener("mousemove", (e: MouseEvent) => {
      if (e.clientY < 56) setToolbarVisible(true);
    }, { passive: true });
    doc.addEventListener("mousedown", () => {
      setTimeout(() => sentinelRef.current?.focus({ preventScroll: true }), 0);
    }, { passive: true });
  }

  function handleRendered() {
    if (viewerRef.current) {
      attachIframeKeys(viewerRef.current);
      attachIframeSwipe(viewerRef.current);
    }
    applyBookmarkAnnotations();
    if (!bookmarkJumpingRef.current) setTransitioning(false);
  }

  const t = THEMES[settings.theme];
  useLayoutEffect(() => { themeLinkColorRef.current = t.link; }, [t.link]);
  // eslint-disable-next-line react-hooks/refs
  const bookLanguage = bookLanguageRef.current;

  // Hide the viewer, reposition while invisible, then fade back in already
  // aligned — so the user sees one clean move instead of display()'s jump
  // followed by the scroll-to-top (the "two jumps").
  function goToBookmark(cfi: string, phrase?: string) {
    const rendition = renditionRef.current;
    if (!rendition) return;
    bookmarkJumpingRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      displayCfiAlignedTop(rendition, cfi, phrase).finally(() => {
        bookmarkJumpingRef.current = false;
        requestAnimationFrame(() => setTransitioning(false));
      });
    }, 250);
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-3rem)] items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">{error}</p>
          <Link to="/lector" viewTransition><Button>Volver a la biblioteca</Button></Link>
        </div>
      </div>
    );
  }

  const effectiveChapterIdx = audioActive ? audiobookState.currentChapterIdx : currentChapterIdx;
  const effectiveChaptersLength = audioActive ? audiobookState.chapters.length : chapters.length;
  const effectiveCurrentChapter = audioActive
    ? (aiChapterTitles[audiobookState.currentChapterIdx] ?? audiobookState.chapters[audiobookState.currentChapterIdx]?.title ?? currentChapter)
    : currentChapter;

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[100] flex flex-col overflow-hidden"
          : "flex h-[calc(100vh-3rem)] w-full flex-col overflow-hidden"
      }
      style={{ background: t.bg, color: t.text, maxWidth: fullscreen ? "100vw" : undefined }}
    >
      <style>{`
        #epub-toc-list::-webkit-scrollbar { width: 5px; }
        #epub-toc-list::-webkit-scrollbar-track { background: transparent; }
        #epub-toc-list::-webkit-scrollbar-thumb { background: rgba(91,124,255,0.4); border-radius: 999px; }
        #epub-toc-list::-webkit-scrollbar-thumb:hover { background: rgba(91,124,255,0.7); }
      `}</style>

      <ReaderToolbar
        theme={t}
        ready={ready}
        toolbarVisible={toolbarVisible}
        fullscreen={fullscreen}
        currentChapter={effectiveCurrentChapter}
        bookTitle={bookMeta?.title}
        currentChapterIdx={effectiveChapterIdx}
        chaptersLength={effectiveChaptersLength}
        bookmarksCount={bookmarks.length}
        showSearch={showSearch}
        showBookmarks={showBookmarks}
        showSettings={showSettings}
        showToc={showToc}
        onPrevChapter={prevChapter}
        onNextChapter={nextChapter}
        onToggleSearch={() => togglePanel("search")}
        onToggleBookmarks={() => togglePanel("bookmarks")}
        onToggleSettings={() => togglePanel("settings")}
        onToggleToc={() => togglePanel("toc")}
        onToggleFullscreen={toggleFullscreen}
        onMouseEnter={() => setToolbarVisible(true)}
      />

      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        {/* Velo: atenúa el texto y cierra el panel abierto al tocar fuera.
            En pantallas anchas (lg) los paneles se acoplan y no hace falta. */}
        {(showSearch || showBookmarks || showSettings || showToc) && (
          <div
            className="absolute inset-0 z-10 bg-black/30 lg:hidden"
            onClick={() => {
              setShowSearch(false);
              setShowBookmarks(false);
              setShowSettings(false);
              setShowToc(false);
            }}
          />
        )}
        {showSearch && (
          <SearchPanel
            theme={t}
            results={searchResults}
            loading={searchLoading}
            onClose={() => setShowSearch(false)}
            onGoToResult={(cfi) => renditionRef.current?.display(cfi)}
            onSearch={runSearch}
          />
        )}

        {showBookmarks && (
          <BookmarkPanel
            theme={t}
            bookmarks={bookmarks}
            onClose={() => setShowBookmarks(false)}
            onGoTo={(bm) => goToBookmark(bm.cfi, bm.phrase)}
            onDelete={deleteBookmark}
          />
        )}

        {showToc && (
          <TocPanel
            theme={t}
            chapters={
              audioActive
                ? audiobookState.chapters.map((c, i) => ({ label: aiChapterTitles[i] ?? c.title, href: String(i), depth: 0, spineIndex: i }))
                : chapters
            }
            currentChapter={effectiveCurrentChapter}
            onClose={() => setShowToc(false)}
            onGoToChapter={(href) => {
              setShowToc(false);
              // Misma transición con fundido en ambos modos.
              if (audioActive) {
                withChapterTransition(() =>
                  audiobookControls.goToChapter(Number(href)),
                );
              } else {
                navigateChapter(href);
              }
            }}
          />
        )}

        {showSettings && (
          <SettingsPanel
            theme={t}
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setShowSettings(false)}
            onApply={applySettings}
            onSetSettings={setSettings}
          />
        )}

        <div ref={sentinelRef} tabIndex={0} aria-hidden className="sr-only" />

        <div className="flex-1 relative" style={{ overflow: "hidden", maxWidth: "100%" }}>
          {!ready && !error && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6"
              style={{ background: t.bg }}
            >
              {(() => {
                const cover = navState?.coverPath ?? bookMeta?.coverPath;
                const title = navState?.title ?? bookMeta?.title;
                const vtName = { viewTransitionName: `book-cover-${bookId}` };
                return cover ? (
                  <img
                    src={cover}
                    alt={title ?? ""}
                    style={vtName}
                    className="h-[70vh] max-h-[620px] w-auto max-w-[80vw] rounded-xl object-cover shadow-2xl ring-1 ring-black/20"
                  />
                ) : (
                  <div
                    style={vtName}
                    className="flex h-[70vh] max-h-[620px] w-[46vh] max-w-[80vw] flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-primary/30 via-primary/10 to-background px-4 text-center shadow-2xl"
                  >
                    <BookOpen className="h-10 w-10 text-primary/50" />
                    <p className="line-clamp-3 text-xs font-semibold leading-tight text-foreground/70">
                      {title}
                    </p>
                  </div>
                );
              })()}
              <div className="flex items-center gap-2 text-sm" style={{ color: t.text }}>
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: t.link }} />
                Abriendo el libro…
              </div>
            </div>
          )}
          <div
            ref={viewerRef}
            className="h-full w-full"
            style={{ overflow: "hidden", opacity: transitioning ? 0 : 1, transition: "opacity 0.25s ease" }}
          />

          {showAddBookmark && (
            <AddBookmarkDialog
              theme={t}
              phrase={bookmarkPhrase}
              note={bookmarkNote}
              raised={audiobookState.hasFile}
              onNoteChange={setBookmarkNote}
              onSave={addBookmark}
              onClose={() => setShowAddBookmark(false)}
            />
          )}

          {lookup && (
            <WordLookupPopup
              theme={t}
              lookup={lookup}
              bookLanguage={bookLanguage}
              raised={audiobookState.hasFile}
              onClose={() => setLookup(null)}
              onSave={saveWord}
              onAddBookmark={() => {
                setBookmarkPhrase(lookup?.term ?? "");
                setLookup(null);
                setShowAddBookmark(true);
              }}
            />
          )}

          {audiobookState.hasFile && audioScrollSync && (
            <button
              onClick={handleFollowClick}
              title={followScroll ? "Siguiendo la línea" : "Ir a la línea"}
              style={{
                position: "fixed",
                // En móvil el reproductor tiene tres filas (más alto) y llega
                // casi al borde: el botón sube para no quedar debajo.
                bottom: isPhone
                  ? "calc(10.5rem + env(safe-area-inset-bottom, 0px))"
                  : "6rem",
                right: isPhone ? "1rem" : "1.5rem",
                zIndex: 50,
                width: "44px", height: "44px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: followScroll ? t.link : `${t.bg}ee`,
                border: `1px solid ${followScroll ? t.link : t.text}22`,
                color: followScroll ? "#fff" : `${t.text}70`,
                backdropFilter: "blur(12px)",
                boxShadow: followScroll ? `0 0 0 3px ${t.link}33` : "none",
                transition: "all .2s",
              }}
            >
              <Locate size={17} />
            </button>
          )}

          <AudiobookPlayer
            state={audiobookState}
            controls={audiobookControls}
            theme={t}
            mappingLoading={chapterMappingLoading}
            scrollSync={audioScrollSync}
            onToggleScrollSync={() => setAudioScrollSync((s) => !s)}
            cursorOffset={cursorOffset}
            onAdjustCursor={adjustCursorOffset}
            aiChapterTitles={aiChapterTitles}
            onResetMapping={resetMapping}
            onEnterAudioMode={() => setAudioOnlyMode(true)}
            sleepTimerLabel={sleepTimerLabel(sleepTimer.timer)}
          />
        </div>
      </div>

      {audioOnly && (
        <AudiobookMode
          state={audiobookState}
          controls={audiobookControls}
          theme={t}
          bookTitle={bookMeta?.title ?? navState?.title}
          coverPath={bookMeta?.coverPath ?? navState?.coverPath}
          aiChapterTitles={aiChapterTitles}
          sleepTimer={sleepTimer}
          onExit={() => setAudioOnlyMode(false)}
        />
      )}
    </div>
  );
}
