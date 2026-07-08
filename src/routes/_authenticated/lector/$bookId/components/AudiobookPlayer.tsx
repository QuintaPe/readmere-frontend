import {
  Play, Pause, SkipBack, SkipForward,
  RotateCcw, RotateCw, Headphones, X,
  Loader2, Navigation, Gauge, Volume2, VolumeX, Volume1, Settings2,
} from "lucide-react";
import { useState } from "react";
import type { AudiobookState, AudiobookControls } from "../hooks/useAudiobook";
import type { ReaderThemeColors } from "@/types/reader";

interface Props {
  state: AudiobookState;
  controls: AudiobookControls;
  theme: ReaderThemeColors;
  mappingLoading?: boolean;
  scrollSync?: boolean;
  onToggleScrollSync?: () => void;
  cursorOffset?: number;
  onAdjustCursor?: (delta: number) => void;
  onResetMapping?: () => void;
  aiChapterTitles?: string[];
}

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export default function AudiobookPlayer({
  state, controls, theme: t,
  mappingLoading, scrollSync, onToggleScrollSync,
  cursorOffset = 0, onAdjustCursor, onResetMapping, aiChapterTitles = [],
}: Props) {
  const [showSpeed, setShowSpeed] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const closeAll = () => { setShowSpeed(false); setShowVolume(false); setShowSettings(false); };
  const volume = state.volume ?? 1;
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const idx = state.currentChapterIdx;
  const ch = state.chapters[idx];
  const chNext = state.chapters[idx + 1];
  const chTitle = aiChapterTitles[idx] ?? ch?.title ?? "";
  const chStart = ch?.startTime ?? 0;
  const chEnd = chNext?.startTime ?? state.duration;
  const chDur = Math.max(1, chEnd - chStart);
  const chElapsed = Math.max(0, state.currentTime - chStart);
  const chPct = Math.min(100, (chElapsed / chDur) * 100);

  const hasPrev = idx > 0;
  const hasNext = idx < state.chapters.length - 1;

  const dim = `${t.text}40`;

  if (!state.hasFile) {
    const hasStored = Boolean(state.savedFileName);
    return (
      <button
        onClick={controls.pickFile}
        title={hasStored ? `Reconectar: ${state.savedFileName}` : "Vincular audiolibro"}
        className="fixed bottom-5 right-5 z-50 transition-opacity hover:opacity-75"
        style={{
          background: `${t.bg}ee`, border: `1px solid ${t.text}20`,
          color: hasStored ? t.link : `${t.text}50`, borderRadius: "999px",
          padding: "0.45rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          backdropFilter: "blur(12px)", fontSize: "12px", fontWeight: 500,
        }}
      >
        <Headphones size={14} />
        {hasStored
          ? <span className="truncate" style={{ maxWidth: "9rem" }}>{state.savedFileName}</span>
          : <span>audiolibro</span>}
      </button>
    );
  }

  return (
    <div
      className="absolute bottom-4 left-1/2 z-50 -translate-x-1/2"
      style={{
        width: "min(600px, calc(100% - 3rem))",
        borderRadius: "16px",
        background: `${t.bg}f0`,
        border: `1px solid ${t.text}12`,
        backdropFilter: "blur(24px)",
        overflow: "visible",
      }}
    >
      {/* Volume slider floating above */}
      {showVolume && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "14px",
            background: `${t.bg}f4`, border: `1px solid ${t.text}12`,
            borderRadius: "12px", backdropFilter: "blur(24px)",
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
          }}
        >
          <VolumeX size={12} style={{ color: `${t.text}40`, flexShrink: 0 }} />
          <input
            type="range" min={0} max={1} step={0.02}
            value={volume}
            onChange={(e) => controls.setVolume(Number(e.target.value))}
            style={{
              width: "80px", height: "3px", accentColor: t.link,
              cursor: "pointer",
              background: `linear-gradient(to right, ${t.link} ${volume * 100}%, ${t.text}20 ${volume * 100}%)`,
            }}
          />
          <Volume2 size={12} style={{ color: `${t.text}40`, flexShrink: 0 }} />
        </div>
      )}

      {/* Speed picker floating above */}
      {showSpeed && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", left: "14px",
            background: `${t.bg}f4`, border: `1px solid ${t.text}12`,
            borderRadius: "12px", backdropFilter: "blur(24px)",
            display: "flex", gap: "2px", padding: "5px 6px",
          }}
        >
          {RATES.map((r) => (
            <button
              key={r}
              onClick={() => { controls.setRate(r); setShowSpeed(false); }}
              style={{
                fontSize: "11px", fontWeight: state.playbackRate === r ? 600 : 400,
                padding: "4px 9px", borderRadius: "8px",
                background: state.playbackRate === r ? `${t.link}20` : "transparent",
                color: state.playbackRate === r ? t.link : `${t.text}55`,
                transition: "all .1s",
              }}
            >
              {r}×
            </button>
          ))}
        </div>
      )}

      {/* Settings popup floating above */}
      {showSettings && (
        <div
          style={{
            position: "absolute", bottom: "calc(100% + 8px)", right: "14px",
            background: `${t.bg}f4`, border: `1px solid ${t.text}12`,
            borderRadius: "14px", backdropFilter: "blur(24px)",
            padding: "10px 14px", display: "flex", flexDirection: "column", gap: "10px",
            minWidth: "180px",
          }}
        >
          {/* Seguir toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Navigation size={12} style={{ color: scrollSync ? t.link : `${t.text}45` }} />
              <span style={{ fontSize: "11px", color: t.text }}>Seguir texto</span>
            </div>
            <button
              onClick={onToggleScrollSync}
              style={{
                width: "32px", height: "18px", borderRadius: "99px", flexShrink: 0,
                background: scrollSync ? t.link : `${t.text}20`,
                position: "relative", transition: "background .2s",
              }}
            >
              <span style={{
                position: "absolute", top: "2px",
                left: scrollSync ? "16px" : "2px",
                width: "14px", height: "14px", borderRadius: "50%",
                background: "#fff", transition: "left .2s",
                boxShadow: "0 1px 3px #0003",
              }} />
            </button>
          </div>

          {/* Reset mapping */}
          {onResetMapping && (
            <button
              onClick={() => { onResetMapping(); closeAll(); }}
              style={{ fontSize: "11px", color: `${t.text}50`, textAlign: "left", padding: "2px 0" }}
              className="hover:opacity-60 transition-opacity"
            >
              Resetear mapeo de capítulos
            </button>
          )}

          {/* Offset — solo si seguir activo */}
          {scrollSync && onAdjustCursor && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: `${t.text}70` }}>Línea</span>
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                <button
                  onClick={() => onAdjustCursor(-2)}
                  className="hover:opacity-60 transition-opacity"
                  style={{ fontSize: "15px", color: `${t.text}50`, padding: "0 6px", lineHeight: 1 }}
                >−</button>
                <span style={{
                  fontSize: "11px", fontWeight: 600, minWidth: "2.5rem", textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                  color: cursorOffset !== 0 ? t.link : `${t.text}30`,
                }}>
                  {cursorOffset > 0 ? `+${cursorOffset}s` : cursorOffset !== 0 ? `${cursorOffset}s` : "0 s"}
                </span>
                <button
                  onClick={() => onAdjustCursor(2)}
                  className="hover:opacity-60 transition-opacity"
                  style={{ fontSize: "15px", color: `${t.text}50`, padding: "0 6px", lineHeight: 1 }}
                >+</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "10px 16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>

        {/* ── Row 1: left | center controls | right ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>

          {/* Left: volume + speed + status */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
            {/* Volume */}
            <button
              onClick={() => { setShowVolume((s) => !s); setShowSpeed(false); setShowSettings(false); }}
              style={{
                display: "flex", alignItems: "center",
                color: showVolume ? t.link : volume === 0 ? `${t.text}35` : dim,
                padding: "2px 4px", borderRadius: "6px",
                background: showVolume ? `${t.link}12` : "transparent",
                transition: "all .1s",
              }}
              className="hover:opacity-75"
            >
              <VolumeIcon size={14} />
            </button>

            <button
              onClick={() => { setShowSpeed((s) => !s); setShowVolume(false); setShowSettings(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontSize: "11px", fontWeight: 500,
                color: showSpeed ? t.link : dim,
                padding: "2px 4px", borderRadius: "6px",
                background: showSpeed ? `${t.link}12` : "transparent",
                transition: "all .1s",
              }}
              className="hover:opacity-75"
            >
              <Gauge size={13} />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{state.playbackRate}×</span>
            </button>
            {state.opfsSaving && (
              <span style={{ fontSize: "9px", color: `${t.text}35` }}>
                {Math.round(state.opfsSaveProgress * 100)}%
              </span>
            )}
            {mappingLoading && !state.opfsSaving && (
              <Loader2 size={10} className="animate-spin" style={{ color: `${t.text}35` }} />
            )}
          </div>

          {/* Center: transport */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <GhostBtn onClick={() => hasPrev && controls.goToChapter(idx - 1)} faded={!hasPrev} color={t.text}>
              <SkipBack size={17} />
            </GhostBtn>

            <GhostBtn onClick={() => controls.skip(-10)} color={t.text}>
              <span style={{ position: "relative", display: "inline-flex" }}>
                <RotateCcw size={17} />
                <span style={{ position: "absolute", fontSize: "5.5px", fontWeight: 700, bottom: "1px", right: "-1px", lineHeight: 1 }}>10</span>
              </span>
            </GhostBtn>

            <button
              onClick={controls.togglePlay}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: t.link, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, transition: "opacity .12s",
              }}
              className="hover:opacity-85"
            >
              {state.isPlaying ? <Pause size={15} /> : <Play size={15} />}
            </button>

            <GhostBtn onClick={() => controls.skip(10)} color={t.text}>
              <span style={{ position: "relative", display: "inline-flex" }}>
                <RotateCw size={17} />
                <span style={{ position: "absolute", fontSize: "5.5px", fontWeight: 700, bottom: "1px", left: "-1px", lineHeight: 1 }}>10</span>
              </span>
            </GhostBtn>

            <GhostBtn onClick={() => hasNext && controls.goToChapter(idx + 1)} faded={!hasNext} color={t.text}>
              <SkipForward size={17} />
            </GhostBtn>
          </div>

          {/* Right: settings + close */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
            <button
              onClick={() => { setShowSettings((s) => !s); setShowSpeed(false); setShowVolume(false); }}
              title="Ajustes"
              style={{
                display: "flex", alignItems: "center", padding: "3px",
                color: showSettings || scrollSync ? t.link : dim,
                transition: "color .15s",
              }}
              className="hover:opacity-70"
            >
              <Settings2 size={15} />
            </button>
            <button
              onClick={controls.removeFile}
              style={{ color: `${t.text}20`, display: "flex", padding: "2px" }}
              className="transition-opacity hover:opacity-60"
              title="Desvincular"
            >
              <X size={12} />
            </button>
          </div>
        </div>

        {/* ── Row 2: progress bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "10px", color: `${t.text}40`, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {fmt(chElapsed)}
          </span>

          <div
            className="group"
            style={{ flex: 1, position: "relative", height: "3px", borderRadius: "99px", background: `${t.text}14`, cursor: "pointer" }}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              controls.seek(chStart + Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * chDur);
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${chPct}%`, borderRadius: "99px", background: t.link }} />
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                position: "absolute", top: "50%", left: `${chPct}%`,
                width: "10px", height: "10px", borderRadius: "50%",
                background: t.text, transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          </div>

          <span style={{ fontSize: "10px", color: `${t.text}40`, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {fmt(chDur)}
          </span>
        </div>

      </div>
    </div>
  );
}

function GhostBtn({ onClick, faded, color, children }: {
  onClick?: () => void; faded?: boolean; color: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={faded ? undefined : onClick}
      className="flex items-center justify-center rounded-full transition-opacity hover:opacity-50"
      style={{ padding: "5px", opacity: faded ? 0.15 : 1, cursor: faded ? "default" : "pointer", color }}
    >
      {children}
    </button>
  );
}
