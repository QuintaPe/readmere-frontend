import { useEffect, useRef, useState, useCallback } from "react";
import type { AudiobookState, AudiobookControls } from "./useAudiobook";

// Autoapagado del audiolibro: por cuenta atrás (minutos) o al terminar el
// capítulo en curso. La cuenta atrás sólo avanza mientras suena el audio,
// así pausar para atender algo no "gasta" el temporizador.

export type SleepTimerState =
  | { mode: "off" }
  | { mode: "minutes"; totalSec: number; remaining: number }
  | { mode: "chapter"; chapterIdx: number };

export type SleepTimer = {
  timer: SleepTimerState;
  startMinutes: (minutes: number) => void;
  startEndOfChapter: () => void;
  cancel: () => void;
};

export function useSleepTimer(
  state: AudiobookState,
  controls: AudiobookControls,
): SleepTimer {
  const [timer, setTimer] = useState<SleepTimerState>({ mode: "off" });

  // Refs frescas sin re-registrar los intervalos (controls se recrea por render).
  const stateRef = useRef(state);
  const controlsRef = useRef(controls);
  useEffect(() => {
    stateRef.current = state;
    controlsRef.current = controls;
  });

  const pauseAudio = useCallback(() => {
    controlsRef.current.getAudio()?.pause();
  }, []);

  // Modo minutos: tic por segundo, sólo descuenta mientras reproduce.
  useEffect(() => {
    if (timer.mode !== "minutes") return;
    const id = setInterval(() => {
      if (!stateRef.current.isPlaying) return;
      setTimer((t) => {
        if (t.mode !== "minutes") return t;
        if (t.remaining <= 1) {
          pauseAudio();
          return { mode: "off" };
        }
        return { ...t, remaining: t.remaining - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timer.mode, pauseAudio]);

  // Modo fin de capítulo: pausa al cruzar la frontera del capítulo armado.
  // Si el cambio de capítulo es un salto manual (ir a otro capítulo, +10s que
  // aterriza lejos de la frontera), se re-arma al capítulo nuevo en vez de
  // pausar: el usuario sigue escuchando y el "fin del capítulo" pasa a ser el
  // del capítulo que ahora suena.
  useEffect(() => {
    if (timer.mode !== "chapter") return;
    const armed = timer.chapterIdx;
    const id = setInterval(() => {
      const s = stateRef.current;
      const idx = s.currentChapterIdx;
      if (idx === armed) return;
      const chStart = s.chapters[idx]?.startTime ?? 0;
      const naturalCross = idx === armed + 1 && s.currentTime - chStart < 2;
      if (naturalCross) {
        pauseAudio();
        // Deja el cursor justo al inicio del capítulo nuevo para retomar limpio.
        controlsRef.current.seek(chStart);
        setTimer({ mode: "off" });
      } else {
        setTimer({ mode: "chapter", chapterIdx: idx });
      }
    }, 300);
    return () => clearInterval(id);
  }, [timer, pauseAudio]);

  const startMinutes = useCallback((minutes: number) => {
    const totalSec = Math.max(60, Math.round(minutes * 60));
    setTimer({ mode: "minutes", totalSec, remaining: totalSec });
  }, []);

  const startEndOfChapter = useCallback(() => {
    setTimer({ mode: "chapter", chapterIdx: state.currentChapterIdx });
  }, [state.currentChapterIdx]);

  const cancel = useCallback(() => setTimer({ mode: "off" }), []);

  return { timer, startMinutes, startEndOfChapter, cancel };
}

/** Etiqueta corta para mostrar el estado del temporizador (chips, botones). */
export function sleepTimerLabel(timer: SleepTimerState): string | null {
  if (timer.mode === "minutes") {
    const m = Math.floor(timer.remaining / 60);
    const s = timer.remaining % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  if (timer.mode === "chapter") return "Fin cap.";
  return null;
}
