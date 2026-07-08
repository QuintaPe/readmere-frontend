import { useEffect } from "react";
import type { AudiobookState, AudiobookControls } from "./useAudiobook";

interface Props {
  hasFile: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renditionRef: React.RefObject<any>;
  viewerRef: React.RefObject<HTMLElement | null>;
  audiobookStateRef: React.MutableRefObject<AudiobookState>;
  audiobookControlsRef: React.MutableRefObject<AudiobookControls>;
  audioScrollSyncRef: React.MutableRefObject<boolean>;
  cursorOffsetRef: React.MutableRefObject<number>;
  themeLinkColorRef: React.MutableRefObject<string>;
  followScrollRef: React.MutableRefObject<boolean>;
  suppressScrollUntilRef: React.MutableRefObject<number>;
  lastTargetYRef: React.MutableRefObject<number>;
  lastAutoScrollTopRef: React.MutableRefObject<number>;
}

type Cache = {
  els: HTMLElement[];
  tops: number[];
  cumWeights: number[];
  yPoints: number[];
};

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const SPEECH_RATE = 4.5;

function countSyls(text: string): number {
  return text.split(/\s+/).filter(Boolean).reduce((sum, word) => {
    const clean = word.toLowerCase().replace(/[^a-záéíóúüñ]/g, "");
    return sum + Math.max(1, (clean.match(/[aeiouáéíóúü]+/g) ?? []).length);
  }, 0);
}

function elementWeight(el: HTMLElement): number {
  const text = el.textContent?.trim() ?? "";
  if (!text) return 0;
  const syls = countSyls(text);
  const sentenceEnds = (text.match(/[.!?…]+(?=\s|$)/g) ?? []).length;
  const midPauses = (text.match(/[,;:—–]/g) ?? []).length;
  const numbers = (text.match(/\d+/g) ?? []).length;
  const pauseSecs = sentenceEnds * 0.6 + midPauses * 0.25 + numbers * 0.3 + 0.2;
  if (HEADING_TAGS.has(el.tagName)) return syls / 3.0 + pauseSecs + 1.2;
  return syls / SPEECH_RATE + pauseSecs;
}

function absTop(el: HTMLElement, body: HTMLElement): number {
  let y = 0, n: HTMLElement | null = el;
  while (n && n !== body) { y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
  return y;
}

function buildCache(doc: Document): Cache {
  const body = doc.body;
  const els = Array.from(
    body.querySelectorAll<HTMLElement>("p,h1,h2,h3,h4,h5,h6,li,blockquote,td"),
  ).filter((el) => (el.textContent?.trim().length ?? 0) > 5 && el.offsetHeight > 0);

  const tops = els.map((el) => absTop(el, body));
  const weights = els.map(elementWeight);
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  const timePoints: number[] = [];
  const yPoints: number[] = [];
  let cum = 0;

  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const wFrac = weights[i] / total;
    const top = tops[i];
    const height = el.offsetHeight;
    const text = el.textContent?.trim() ?? "";
    const isHeading = HEADING_TAGS.has(el.tagName);

    if (!isHeading && height > 30) {
      const sentences = text.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 3);
      if (sentences.length >= 2) {
        const sentSyls = sentences.map((s) => countSyls(s));
        const sentTotal = sentSyls.reduce((a, b) => a + b, 0) || 1;
        let cumSentFrac = 0;
        for (let j = 0; j < sentences.length; j++) {
          timePoints.push(cum + wFrac * cumSentFrac);
          yPoints.push(top + height * cumSentFrac);
          cumSentFrac += sentSyls[j] / sentTotal;
        }
        cum += wFrac;
        continue;
      }
    }

    timePoints.push(cum);
    yPoints.push(top);
    cum += wFrac;
  }

  timePoints.push(1);
  const lastIdx = els.length - 1;
  yPoints.push(lastIdx >= 0 ? tops[lastIdx] + els[lastIdx].offsetHeight : doc.body.scrollHeight - 4);

  return { els, tops, cumWeights: timePoints, yPoints };
}

function ensureCursor(doc: Document, color: string): HTMLDivElement {
  let cursor = doc.getElementById("lc-audio-cursor") as HTMLDivElement | null;
  if (!cursor) {
    if (!doc.getElementById("lc-cursor-style")) {
      const s = doc.createElement("style");
      s.id = "lc-cursor-style";
      s.textContent = "@keyframes lc-fade { 0%,100%{opacity:.2} 50%{opacity:.38} }";
      doc.head.appendChild(s);
    }
    cursor = doc.createElement("div") as HTMLDivElement;
    cursor.id = "lc-audio-cursor";
    cursor.style.cssText = `position:absolute;left:0;right:0;height:1px;pointer-events:none;z-index:9999;background:linear-gradient(to right,${color} 0px,${color} 32px,transparent 32px,transparent calc(100% - 32px),${color} calc(100% - 32px),${color} 100%);animation:lc-fade 3s ease-in-out infinite;will-change:transform`;
    doc.body.style.position = "relative";
    doc.body.appendChild(cursor);
  }
  return cursor;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDoc(renditionRef: React.RefObject<any>, viewerRef: React.RefObject<HTMLElement | null>): Document | undefined {
  try {
    const mgr = renditionRef.current?.manager;
    const views = mgr?.views?._views || [];
    const v = views[0];
    const doc = v?.document || v?.contents?.document;
    if (doc) return doc;
    const container = mgr?.container ?? viewerRef.current;
    return (container?.querySelector("iframe") as HTMLIFrameElement | null)?.contentDocument ?? undefined;
  } catch { return undefined; }
}

export function useAudioCursor({
  hasFile,
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
}: Props) {
  useEffect(() => {
    if (!hasFile) return;

    let rafId: number;
    let cache: Cache | null = null;
    let cachedDoc: Document | null = null;
    let lastChapterIdx = -1;
    let lastProgress = -1;
    let prevT = performance.now();

    function frame(now: number) {
      rafId = requestAnimationFrame(frame);
      const dt = Math.min((now - prevT) / 1000, 0.1);
      prevT = now;
      try {
        const st = audiobookStateRef.current;
        if (!st.hasFile || st.chapters.length === 0) return;
        const audio = audiobookControlsRef.current.getAudio();
        if (!audio) return;

        const idx = st.currentChapterIdx;
        const chs = st.chapters;
        const start = chs[idx]?.startTime ?? 0;
        const end = chs[idx + 1]?.startTime ?? (audio.duration || 0);
        const span = end - start;
        if (span <= 0) return;

        const introSecs = Math.min(15, 2 + (chs[idx]?.title ?? "").trim().split(/\s+/).filter(Boolean).length * 1.0) + cursorOffsetRef.current;
        const contentStart = start + introSecs;
        const contentSpan = Math.max(1, end - contentStart);
        const progress = audio.currentTime < contentStart
          ? 0
          : Math.min(1, (audio.currentTime - contentStart) / contentSpan);

        const doc = getDoc(renditionRef, viewerRef);
        if (!doc) return;

        // Document swapped (new iframe) — reset
        if (doc !== cachedDoc) {
          cachedDoc?.getElementById?.("lc-audio-cursor")?.remove();
          cache = null;
          lastProgress = -1;
          cachedDoc = doc;
        }

        // Chapter changed — reset cache
        if (idx !== lastChapterIdx) {
          doc.getElementById("lc-audio-cursor")?.remove();
          cache = null;
          lastProgress = -1;
          lastChapterIdx = idx;
        }

        if (Math.abs(progress - lastProgress) < 0.00005) return;
        lastProgress = progress;

        const syncOn = audioScrollSyncRef.current;
        const existingCursor = doc.getElementById("lc-audio-cursor") as HTMLDivElement | null;
        if (!syncOn) {
          if (existingCursor) existingCursor.style.opacity = "0";
          return;
        }
        if (existingCursor) existingCursor.style.opacity = "";

        const cursor = ensureCursor(doc, themeLinkColorRef.current);

        if (!cache) {
          const built = buildCache(doc);
          if (built.els.length > 0 && built.els[0].isConnected) {
            cache = built;
          } else {
            lastProgress = -1;
            return;
          }
        } else if (cache.els.length > 0 && !cache.els[0].isConnected) {
          cache = null;
          lastProgress = -1;
          return;
        }

        const { els, cumWeights: timePoints, yPoints } = cache;

        if (els.length > 0) {
          const marginPx = Math.max(4, els[0].offsetLeft - 20);
          const c = themeLinkColorRef.current;
          cursor.style.background = `linear-gradient(to right,${c} 0px,${c} ${marginPx}px,transparent ${marginPx}px,transparent calc(100% - ${marginPx}px),${c} calc(100% - ${marginPx}px),${c} 100%)`;
        }

        let lo = 0, hi = timePoints.length - 2;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (timePoints[mid] <= progress) lo = mid; else hi = mid - 1;
        }
        const t0 = timePoints[lo], t1 = timePoints[lo + 1];
        const rawFrac = t1 > t0 ? (progress - t0) / (t1 - t0) : 0;
        const frac = rawFrac < 0.5
          ? 2 * rawFrac * rawFrac
          : 1 - Math.pow(-2 * rawFrac + 2, 2) / 2;
        const targetY = yPoints[lo] + (yPoints[lo + 1] - yPoints[lo]) * frac;

        cursor.style.top = "0";
        cursor.style.transform = `translateY(${targetY}px)`;

        lastTargetYRef.current = targetY;

        // Auto-scroll in follow mode
        if (followScrollRef.current) {
          const container: HTMLElement | null =
            renditionRef.current?.manager?.container ?? viewerRef.current ?? null;
          if (container) {
            const scrollTo = Math.max(0, targetY - container.clientHeight * 0.38);
            const current = container.scrollTop;
            const ease = 1 - Math.exp(-dt * 4);
            const next = current + (scrollTo - current) * ease;
            lastAutoScrollTopRef.current = next;
            container.scrollTop = next;
          }
        }
      } catch { /* noop */ }
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFile]);
}
