import { useRef, useState, useCallback, useEffect } from "react";
import { mapChaptersByAI } from "@/lib/ai.functions";
import { toast } from "sonner";
import { audiobookKeys } from "../lib/audiobook-keys";
import type { Chapter } from "@/types/reader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UseAudioChapterMappingProps {
  bookId: string | undefined;
  audiobookChapters: { title: string }[];
  chapters: Chapter[];
  chaptersRef: React.MutableRefObject<Chapter[]>;
  renditionRef: React.MutableRefObject<Any>;
  bookRef: React.MutableRefObject<Any>;
  currentChapterIdxRef: React.MutableRefObject<number>;
}

export function useAudioChapterMapping({
  bookId,
  audiobookChapters,
  chapters,
  chaptersRef,
  renditionRef,
  bookRef,
  currentChapterIdxRef,
}: UseAudioChapterMappingProps) {
  const [chapterMappingLoading, setChapterMappingLoading] = useState(false);
  const [aiChapterTitles, setAiChapterTitles] = useState<string[]>(() => {
    if (!bookId) return [];
    try {
      return JSON.parse(
        localStorage.getItem(audiobookKeys(bookId).chapterTitles) ?? "[]",
      ) ?? [];
    } catch {
      return [];
    }
  });

  // a2e[audioIdx] = epubIdx,  e2a[epubIdx] = audioIdx (-1 = no match)
  const a2eRef = useRef<number[]>([]);
  const e2aRef = useRef<number[]>([]);
  // absorbedAfterRef[epubIdx] = list of epub chapter indices whose content is injected after epubIdx
  const absorbedAfterRef = useRef<Map<number, number[]>>(new Map());
  const lastInjectedEpubIdxRef = useRef(-1);

  const injectAbsorbed = useCallback(async (epubIdx: number) => {
    if (lastInjectedEpubIdxRef.current === epubIdx) return;
    const toInject = absorbedAfterRef.current.get(epubIdx);
    if (!toInject || toInject.length === 0) {
      lastInjectedEpubIdxRef.current = epubIdx;
      return;
    }
    const rendition = renditionRef.current;
    const epubBook = bookRef.current;
    if (!rendition || !epubBook) return;
    const views = rendition.manager?.views?._views || [];
    const doc: Document | undefined = views[0]?.document || views[0]?.contents?.document;
    if (!doc) return;
    lastInjectedEpubIdxRef.current = epubIdx;
    // Remove any previous injection
    doc.getElementById("lc-absorbed")?.remove();
    const wrapper = doc.createElement("div");
    wrapper.id = "lc-absorbed";
    const parentHref = chaptersRef.current[epubIdx]?.href ?? "";
    const parentFile = parentHref.split("#")[0];

    const primarySet = new Set(a2eRef.current);
    let nextPrimaryFile = "";
    for (let ni = epubIdx + 1; ni < chaptersRef.current.length; ni++) {
      if (primarySet.has(ni)) {
        nextPrimaryFile = (chaptersRef.current[ni]?.href ?? "").split("#")[0];
        break;
      }
    }

    for (const absIdx of toInject) {
      const absHref = chaptersRef.current[absIdx]?.href;
      if (!absHref) continue;
      const absFile = absHref.split("#")[0];
      if (absFile === parentFile || absFile === nextPrimaryFile) continue;
      try {
        const spineItem = epubBook.spine.get(absHref);
        if (!spineItem) continue;
        await spineItem.load(epubBook.load.bind(epubBook));
        const srcDoc: Document | undefined = spineItem.document;
        if (srcDoc?.body) {
          const sep = doc.createElement("div");
          sep.style.cssText = "border-top:1px solid rgba(128,128,128,0.15);margin:2em 0 1em";
          wrapper.appendChild(sep);
          const div = doc.createElement("div");
          div.innerHTML = srcDoc.body.innerHTML;
          wrapper.appendChild(div);
          spineItem.unload();
        }
      } catch { /* noop */ }
    }
    if (wrapper.children.length > 0) doc.body.appendChild(wrapper);
  }, [renditionRef, bookRef, chaptersRef]);

  useEffect(() => {
    const audioChs = audiobookChapters;
    if (audioChs.length === 0 || chapters.length === 0) return;

    function applyMap(a2e: number[]) {
      let last = 0;
      for (let i = 0; i < a2e.length; i++) {
        if (a2e[i] !== -1) last = a2e[i];
        else a2e[i] = last;
      }
      const e2a: number[] = new Array(chapters.length).fill(-1);
      for (let ai = a2e.length - 1; ai >= 0; ai--) {
        e2a[a2e[ai]] = ai;
      }
      a2eRef.current = a2e;
      e2aRef.current = e2a;
      const primarySet = new Set(a2e);
      const absorbed = new Map<number, number[]>();
      for (let ei = 0; ei < chapters.length; ei++) {
        if (!primarySet.has(ei)) {
          for (let parent = ei - 1; parent >= 0; parent--) {
            if (primarySet.has(parent)) {
              if (!absorbed.has(parent)) absorbed.set(parent, []);
              absorbed.get(parent)!.push(ei);
              break;
            }
          }
        }
      }
      absorbedAfterRef.current = absorbed;
      lastInjectedEpubIdxRef.current = -1;
      injectAbsorbed(currentChapterIdxRef.current).catch(() => { });
    }

    let cancelled = false;

    function proportionalMap() {
      const epubLen = chapters.length;
      return audioChs.map((_, ai) =>
        Math.min(epubLen - 1, Math.floor(ai * epubLen / audioChs.length)),
      );
    }

    const mapCacheKey = bookId ? audiobookKeys(bookId).chapterMap : null;

    if (mapCacheKey) {
      try {
        const raw = localStorage.getItem(mapCacheKey);
        if (raw) {
          const cached: number[] = JSON.parse(raw);
          if (cached.length === audioChs.length) {
            applyMap(cached);
            return () => { cancelled = true; };
          }
        }
      } catch { /* noop */ }
    }

    applyMap(proportionalMap());

    setTimeout(() => setChapterMappingLoading(true), 0);
    mapChaptersByAI(
      audioChs.map((c) => c.title),
      chapters.map((c) => c.label),
    ).then((result) => {
      if (cancelled) return;
      setChapterMappingLoading(false);
      if (result.map.length === audioChs.length) {
        applyMap(result.map);
        const titlesCacheKey = bookId ? audiobookKeys(bookId).chapterTitles : null;
        if (mapCacheKey) localStorage.setItem(mapCacheKey, JSON.stringify(result.map));
        if (titlesCacheKey && result.titles.length) {
          localStorage.setItem(titlesCacheKey, JSON.stringify(result.titles));
          setAiChapterTitles(result.titles);
        }
        toast.success("Capítulos sincronizados con IA");
      }
    }).catch(() => {
      if (cancelled) return;
      setChapterMappingLoading(false);
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audiobookChapters, chapters, injectAbsorbed]);

  function resetMapping() {
    if (bookId) {
      const k = audiobookKeys(bookId);
      localStorage.removeItem(k.chapterMap);
      localStorage.removeItem(k.chapterTitles);
    }
    setAiChapterTitles([]);
    lastInjectedEpubIdxRef.current = -1;
    absorbedAfterRef.current = new Map();
  }

  return {
    chapterMappingLoading,
    aiChapterTitles,
    a2eRef,
    e2aRef,
    injectAbsorbed,
    resetMapping,
  };
}
