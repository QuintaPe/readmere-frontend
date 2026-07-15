import {
  Play, Pause, SkipBack, SkipForward,
  RotateCcw, RotateCw, Headphones, X,
  Loader2, Navigation, Gauge, Volume2, VolumeX, Volume1, Settings2,
  Expand, Moon,
} from "lucide-react";
import { useState } from "react";
import type { AudiobookState, AudiobookControls } from "../hooks/useAudiobook";
import SeekBar from "./SeekBar";
import type { ReaderThemeColors } from "@/types/reader";
import { isTouchDevice } from "@/lib/utils";
import { useIsPhone } from "@/hooks/use-mobile";

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
  /** Entra en el modo solo audiolibro (reproductor a pantalla completa). */
  onEnterAudioMode?: () => void;
  /** Etiqueta del temporizador de apagado si está activo (p. ej. "12:34"). */
  sleepTimerLabel?: string | null;
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
  onEnterAudioMode, sleepTimerLabel,
}: Props) {
  // Teléfono (táctil + estrecho): layout compacto de 3 filas. iPad y
  // escritorio comparten la fila única clásica.
  const isPhone = useIsPhone();
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
        className="fixed right-5 z-50 transition-opacity hover:opacity-75"
        style={{
          bottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))",
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

  // ── Piezas compartidas por los dos layouts (escritorio y táctil) ──

  const statusChips = (
    <>
      {sleepTimerLabel && (
        <span
          title="Temporizador de apagado activo"
          style={{
            display: "flex", alignItems: "center", gap: "3px",
            fontSize: "10px", fontWeight: 600, color: t.link,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <Moon size={11} />
          {sleepTimerLabel}
        </span>
      )}
      {state.opfsSaving && (
        <span style={{ fontSize: "9px", color: `${t.text}35` }}>
          {Math.round(state.opfsSaveProgress * 100)}%
        </span>
      )}
      {mappingLoading && !state.opfsSaving && (
        <Loader2 size={10} className="animate-spin" style={{ color: `${t.text}35` }} />
      )}
    </>
  );

  const speedBtn = (
    <button
      onClick={() => { setShowSpeed((s) => !s); setShowVolume(false); setShowSettings(false); }}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        fontSize: "11px", fontWeight: 500,
        color: showSpeed ? t.link : dim,
        padding: isTouchDevice ? "10px 8px" : "2px 4px", borderRadius: "6px",
        background: showSpeed ? `${t.link}12` : "transparent",
        transition: "all .1s",
      }}
      className="hover:opacity-75"
    >
      <Gauge size={13} />
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{state.playbackRate}×</span>
    </button>
  );

  const expandBtn = onEnterAudioMode && (
    <button
      onClick={() => { closeAll(); onEnterAudioMode(); }}
      title="Modo audiolibro"
      style={{
        display: "flex", alignItems: "center",
        padding: isTouchDevice ? "10px" : "3px", color: dim,
      }}
      className="hover:opacity-70 transition-opacity"
    >
      <Expand size={14} />
    </button>
  );

  const settingsBtn = (
    <button
      onClick={() => { setShowSettings((s) => !s); setShowSpeed(false); setShowVolume(false); }}
      title="Ajustes"
      style={{
        display: "flex", alignItems: "center",
        padding: isTouchDevice ? "10px" : "3px",
        color: showSettings || scrollSync ? t.link : dim,
        transition: "color .15s",
      }}
      className="hover:opacity-70"
    >
      <Settings2 size={15} />
    </button>
  );

  const transport = (
    <div style={{ display: "flex", alignItems: "center", gap: isTouchDevice ? "10px" : "12px" }}>
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
          width: isTouchDevice ? "44px" : "36px",
          height: isTouchDevice ? "44px" : "36px",
          borderRadius: "50%",
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
  );

  const progressRow = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "10px", color: `${t.text}40`, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {fmt(chElapsed)}
      </span>

      <div style={{ flex: 1 }}>
        <SeekBar
          pct={chPct}
          theme={t}
          trackHeight={3}
          touchPadding={10}
          onSeekRatio={(r) => controls.seek(chStart + r * chDur)}
          previewTime={(r) => fmt(r * chDur)}
        />
      </div>

      <span style={{ fontSize: "10px", color: `${t.text}40`, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
        {fmt(chDur)}
      </span>
    </div>
  );

  return (
    <div
      className="absolute left-1/2 z-50 -translate-x-1/2"
      style={{
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        // En móvil apuramos los márgenes: cada px de barra cuenta.
        width: isPhone
          ? "min(600px, calc(100% - 1.25rem))"
          : "min(600px, calc(100% - 3rem))",
        borderRadius: "16px",
        background: `${t.bg}f0`,
        border: `1px solid ${t.text}12`,
        backdropFilter: "blur(24px)",
        overflow: "visible",
      }}
    >
      {/* Volume slider floating above (no en móvil: allí el volumen se
          controla con los botones físicos; iOS además ignora audio.volume) */}
      {showVolume && !isPhone && (
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
                padding: isTouchDevice ? "10px 11px" : "4px 9px", borderRadius: "8px",
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
              style={{
                fontSize: "11px", color: `${t.text}50`, textAlign: "left",
                padding: isTouchDevice ? "8px 0" : "2px 0",
              }}
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
                  style={{
                    fontSize: "15px", color: `${t.text}50`, lineHeight: 1,
                    padding: isTouchDevice ? "10px 12px" : "0 6px",
                  }}
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
                  style={{
                    fontSize: "15px", color: `${t.text}50`, lineHeight: 1,
                    padding: isTouchDevice ? "10px 12px" : "0 6px",
                  }}
                >+</button>
              </div>
            </div>
          )}

          {/* Desvincular: en móvil vive aquí (en la barra no cabe y evita
              toques accidentales); en iPad/escritorio sigue como X en la barra. */}
          {isPhone && (
            <button
              onClick={() => { closeAll(); controls.removeFile(); }}
              style={{ fontSize: "11px", color: "#e5484d99", textAlign: "left", padding: "8px 0" }}
              className="hover:opacity-60 transition-opacity"
            >
              Desvincular audiolibro
            </button>
          )}
        </div>
      )}

      <div style={{ padding: "10px 16px 12px", display: "flex", flexDirection: "column", gap: isPhone ? "4px" : "8px" }}>
        {isPhone ? (
          <>
            {/* ── Móvil: transporte / progreso / secundarios ──
                Tres filas: la única forma de que los 5 botones de transporte
                tengan zona pulsable decente en un móvil estrecho. */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              {transport}
            </div>

            {progressRow}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {speedBtn}
                {statusChips}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {expandBtn}
                {settingsBtn}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ── iPad/escritorio · Row 1: left | center controls | right ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
              {/* Left: volume + speed + status */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                <button
                  onClick={() => { setShowVolume((s) => !s); setShowSpeed(false); setShowSettings(false); }}
                  style={{
                    display: "flex", alignItems: "center",
                    color: showVolume ? t.link : volume === 0 ? `${t.text}35` : dim,
                    // En iPad (táctil pero ancho) también engorda la zona pulsable.
                    padding: isTouchDevice ? "10px 8px" : "2px 4px",
                    borderRadius: "6px",
                    background: showVolume ? `${t.link}12` : "transparent",
                    transition: "all .1s",
                  }}
                  className="hover:opacity-75"
                >
                  <VolumeIcon size={14} />
                </button>

                {speedBtn}
                {statusChips}
              </div>

              {/* Center: transport */}
              {transport}

              {/* Right: audio mode + settings + close */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                {expandBtn}
                {settingsBtn}
                <button
                  onClick={controls.removeFile}
                  style={{
                    color: `${t.text}20`, display: "flex",
                    padding: isTouchDevice ? "10px" : "2px",
                  }}
                  className="transition-opacity hover:opacity-60"
                  title="Desvincular"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* ── Escritorio · Row 2: progress bar ── */}
            {progressRow}
          </>
        )}
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
      style={{
        // En táctil, zona pulsable ~40px sin que el icono crezca.
        padding: isTouchDevice ? "11px" : "5px",
        opacity: faded ? 0.15 : 1,
        cursor: faded ? "default" : "pointer",
        color,
      }}
    >
      {children}
    </button>
  );
}
