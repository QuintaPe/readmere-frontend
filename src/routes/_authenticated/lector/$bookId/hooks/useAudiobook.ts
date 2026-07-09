import { useState, useRef, useEffect, useCallback } from "react";
import {
  removeHandle,
  saveFileToOPFS,
  loadFileFromOPFS,
  removeFileFromOPFS,
  opfsSupported,
  audioMimeFor,
  opfsAudioStreamUrl,
} from "../lib/audiobook-storage";
import { parseM4BChapters, type AudioChapter } from "../lib/m4b-chapters";
import { audiobookKeys, clearAudiobookStorage } from "../lib/audiobook-keys";

export type { AudioChapter };

export type AudiobookState = {
  hasFile: boolean;
  needsPermission: boolean;
  savedFileName: string | null;
  opfsSaving: boolean;
  opfsSaveProgress: number; // 0-1
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  fileName: string | null;
  chapters: AudioChapter[];
  currentChapterIdx: number;
};

export type AudiobookControls = {
  pickFile: () => Promise<void>;
  removeFile: () => Promise<void>;
  getAudio: () => HTMLAudioElement | null;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skip: (delta: number) => void;
  setRate: (rate: number) => void;
  setVolume: (vol: number) => void;
  goToChapter: (idx: number) => void;
};


export function useAudiobook(bookId: string | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const keys = bookId ? audiobookKeys(bookId) : null;
  const fileNameKey = keys?.fileName ?? null;
  const posKey = keys?.position ?? null;

  const [state, setState] = useState<AudiobookState>({
    hasFile: false,
    needsPermission: false,
    savedFileName: fileNameKey
      ? (localStorage.getItem(fileNameKey) ?? null)
      : null,
    opfsSaving: false,
    opfsSaveProgress: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    volume: 1,
    fileName: null,
    chapters: [],
    currentChapterIdx: 0,
  });

  // Restore saved position — wait for enough data to seek
  const restorePosition = useCallback((audio: HTMLAudioElement) => {
    if (!posKey) return;
    const saved = parseFloat(localStorage.getItem(posKey) ?? "");
    if (!isNaN(saved) && saved > 0) {
      audio.addEventListener("canplay", function seek() {
        audio.removeEventListener("canplay", seek);
        audio.currentTime = saved;
      });
    }
  }, [posKey]);

  const mountFile = useCallback(async (file: File, skipOPFSSave = false) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = url;
    audio.load();

    restorePosition(audio);

    if (fileNameKey) localStorage.setItem(fileNameKey, file.name);
    setState((s) => ({
      ...s,
      hasFile: true,
      needsPermission: false,
      savedFileName: file.name,
      opfsSaving: false,
      opfsSaveProgress: 0,
      fileName: file.name,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      chapters: [],
      currentChapterIdx: 0,
    }));

    // Save to OPFS in background so future sessions auto-load (skip if loaded from OPFS)
    if (!skipOPFSSave && bookId && opfsSupported()) {
      setState((s) => ({ ...s, opfsSaving: true, opfsSaveProgress: 0 }));
      saveFileToOPFS(bookId, file, (ratio) => {
        setState((s) => ({ ...s, opfsSaveProgress: ratio }));
      }).then(() => {
        setState((s) => ({ ...s, opfsSaving: false, opfsSaveProgress: 1 }));
      }).catch(() => {
        setState((s) => ({ ...s, opfsSaving: false }));
      });
    }

    // Restore cached chapters first (instant), then re-parse only if not cached
    const chaptersKey = bookId ? audiobookKeys(bookId).chapters : null;
    const cached = chaptersKey ? localStorage.getItem(chaptersKey) : null;
    if (cached) {
      try {
        const chapters: AudioChapter[] = JSON.parse(cached);
        if (chapters.length > 0) {
          setState((s) => ({ ...s, chapters }));
          return;
        }
      } catch { /* noop */ }
    }

    try {
      const chapters = await parseM4BChapters(file);
      if (chapters.length > 0) {
        if (chaptersKey) localStorage.setItem(chaptersKey, JSON.stringify(chapters));
        setState((s) => ({ ...s, chapters }));
      }
    } catch (e) {
      console.warn("[Audiobook] No se pudieron leer los capítulos:", e);
    }
  }, [bookId, fileNameKey, restorePosition]);

  // Camino rápido (iPad): monta el audio como streaming servido por el service
  // worker con soporte Range, sin leer el archivo entero a memoria. Devuelve
  // true si lo consiguió; false si hay que recurrir al blob URL clásico.
  const mountFromServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!bookId) return false;
    const savedName = fileNameKey ? localStorage.getItem(fileNameKey) : null;
    const url = await opfsAudioStreamUrl(bookId, audioMimeFor(savedName ?? ""));
    if (!url) return false;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.src = url;
    audio.load();
    restorePosition(audio);

    setState((s) => ({
      ...s,
      hasFile: true,
      needsPermission: false,
      savedFileName: savedName,
      opfsSaving: false,
      opfsSaveProgress: 0,
      fileName: savedName,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      chapters: [],
      currentChapterIdx: 0,
    }));

    // Capítulos: desde caché al instante; si faltan, se parsean en segundo
    // plano leyendo de OPFS (sin bloquear la reproducción).
    const chaptersKey = audiobookKeys(bookId).chapters;
    const cached = localStorage.getItem(chaptersKey);
    let restored = false;
    if (cached) {
      try {
        const chapters: AudioChapter[] = JSON.parse(cached);
        if (chapters.length > 0) {
          setState((s) => ({ ...s, chapters }));
          restored = true;
        }
      } catch { /* noop */ }
    }
    if (!restored) {
      loadFileFromOPFS(bookId).then(async (file) => {
        if (!file) return;
        try {
          const chapters = await parseM4BChapters(file);
          if (chapters.length > 0) {
            localStorage.setItem(chaptersKey, JSON.stringify(chapters));
            setState((s) => ({ ...s, chapters }));
          }
        } catch { /* noop */ }
      }).catch(() => { });
    }
    return true;
  }, [bookId, fileNameKey, restorePosition]);

  // Auto-restore from OPFS if available
  useEffect(() => {
    if (!bookId) return;
    let cancelled = false;
    (async () => {
      // Preferimos streaming por el SW (rápido en iPad); si no está disponible
      // (p. ej. en dev, o SW aún sin controlar la pestaña) leemos el archivo.
      const streamed = await mountFromServiceWorker();
      if (streamed || cancelled) return;
      if (!opfsSupported()) return;
      const file = await loadFileFromOPFS(bookId).catch(() => null);
      if (file && !cancelled) mountFile(file, true);
    })();
    return () => { cancelled = true; };
  }, [bookId, mountFromServiceWorker, mountFile]);

  // Sync <audio> events → state + track current chapter
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const savePos = () => { if (posKey && audio.currentTime > 0) localStorage.setItem(posKey, String(audio.currentTime)); };
    const saveInterval = setInterval(savePos, 5000);
    const onBeforeUnload = () => savePos();
    window.addEventListener("beforeunload", onBeforeUnload);

    const onTimeUpdate = () => {
      setState((s) => {
        const currentTime = audio.currentTime;
        let currentChapterIdx = 0;
        for (let i = s.chapters.length - 1; i >= 0; i--) {
          if (currentTime >= s.chapters[i].startTime) {
            currentChapterIdx = i;
            break;
          }
        }
        return { ...s, currentTime, currentChapterIdx };
      });
    };
    const onDurationChange = () =>
      setState((s) => ({ ...s, duration: audio.duration || 0 }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => { savePos(); setState((s) => ({ ...s, isPlaying: false })); };
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      clearInterval(saveInterval);
      window.removeEventListener("beforeunload", onBeforeUnload);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [state.hasFile, posKey]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const controls: AudiobookControls = {
    pickFile: async () => {
      if (!bookId) return;
      return new Promise<void>((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        // iOS asigna a la extensión .m4b la UTI "com.apple.protected-mpeg-4-audio"
        // ("MPEG-4 protegido", aunque el archivo no tenga DRM) y esa UTI no encaja
        // con ningún accept, así que Safari lo deja en gris. En iOS/iPadOS quitamos
        // el filtro para poder elegirlo; el tipo se valida al montar. En escritorio
        // mantenemos la lista para acotar el diálogo.
        const isIOS =
          /iP(ad|hone|od)/.test(navigator.userAgent) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        input.accept = isIOS ? "" : "audio/*,.mp3,.m4a,.m4b,.ogg,.opus,.aac";
        input.onchange = () => {
          const file = input.files?.[0];
          if (file) mountFile(file).then(resolve);
          else resolve();
        };
        input.click();
      });
    },

    removeFile: async () => {
      if (!bookId) return;
      audioRef.current?.pause();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (audioRef.current) audioRef.current.src = "";
      await removeHandle(bookId);
      clearAudiobookStorage(bookId);
      if (opfsSupported()) removeFileFromOPFS(bookId).catch(() => { });
      setState({
        hasFile: false,
        needsPermission: false,
        savedFileName: null,
        opfsSaving: false,
        opfsSaveProgress: 0,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        playbackRate: 1,
        volume: 1,
        fileName: null,
        chapters: [],
        currentChapterIdx: 0,
      });
    },

    getAudio: () => audioRef.current,

    togglePlay: () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) { audio.play(); } else { audio.pause(); }
    },

    seek: (seconds: number) => {
      if (audioRef.current) audioRef.current.currentTime = seconds;
    },

    skip: (delta: number) => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime + delta);
    },

    setRate: (rate: number) => {
      if (audioRef.current) audioRef.current.playbackRate = rate;
      setState((s) => ({ ...s, playbackRate: rate }));
    },

    setVolume: (vol: number) => {
      const v = Math.max(0, Math.min(1, vol));
      if (audioRef.current) audioRef.current.volume = v;
      setState((s) => ({ ...s, volume: v }));
    },

    goToChapter: (idx: number) => {
      const chapter = state.chapters[idx];
      if (chapter && audioRef.current) {
        audioRef.current.currentTime = chapter.startTime;
      }
    },
  };

  return { state, controls };
}
