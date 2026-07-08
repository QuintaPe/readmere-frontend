import { useEffect, useRef } from "react";
import type { Chapter } from "@/types/reader";
import type { AudiobookState, AudiobookControls } from "./useAudiobook";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UseAudioEpubSyncProps {
  audiobookState: AudiobookState;
  audiobookControls: AudiobookControls;
  chapters: Chapter[];
  chaptersRef: React.MutableRefObject<Chapter[]>;
  renditionRef: React.MutableRefObject<Any>;
  currentChapterIdx: number;
  a2eRef: React.MutableRefObject<number[]>;
  e2aRef: React.MutableRefObject<number[]>;
}

/**
 * Sincronización bidireccional capítulo de audio ↔ capítulo del EPUB.
 * `audioSyncRef` corta el eco: cuando el cambio de capítulo del EPUB lo
 * provocó el propio audio, no hay que re-seekear el audio de vuelta. Los
 * 600 ms de gracia cubren hasta que epub.js termina de renderizar y dispara
 * su evento relocated.
 */
export function useAudioEpubSync({
  audiobookState,
  audiobookControls,
  chapters,
  chaptersRef,
  renditionRef,
  currentChapterIdx,
  a2eRef,
  e2aRef,
}: UseAudioEpubSyncProps) {
  const audioSyncRef = useRef(false);
  const prevAudioChapterIdxRef = useRef(-1);

  // Audio chapter changed → navigate EPUB
  useEffect(() => {
    if (!audiobookState.hasFile || audiobookState.chapters.length === 0) return;
    const audioIdx = audiobookState.currentChapterIdx;
    if (audioIdx === prevAudioChapterIdxRef.current) return;
    prevAudioChapterIdxRef.current = audioIdx;
    const epubIdx = a2eRef.current[audioIdx] ?? -1;
    if (epubIdx < 0 || epubIdx >= chapters.length) return;
    audioSyncRef.current = true;
    renditionRef.current?.display(chaptersRef.current[epubIdx].href);
    setTimeout(() => { audioSyncRef.current = false; }, 600);
  }, [audiobookState.currentChapterIdx, audiobookState.hasFile, audiobookState.chapters.length, chapters.length, a2eRef, chaptersRef, renditionRef]);

  // EPUB chapter changed → seek audio
  useEffect(() => {
    if (!audiobookState.hasFile || audiobookState.chapters.length === 0) return;
    if (audioSyncRef.current) return;
    const audioIdx = e2aRef.current[currentChapterIdx] ?? -1;
    if (audioIdx >= 0) audiobookControls.goToChapter(audioIdx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChapterIdx]);
}
