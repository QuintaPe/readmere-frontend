import {
  Play, Pause, SkipBack, SkipForward, RotateCcw, RotateCw,
  Headphones, ChevronDown, Gauge, Volume2, VolumeX, Volume1, Moon,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { AudiobookState, AudiobookControls } from "../hooks/useAudiobook";
import type { SleepTimer } from "../hooks/useSleepTimer";
import { sleepTimerLabel } from "../hooks/useSleepTimer";
import SeekBar from "./SeekBar";
import type { ReaderThemeColors } from "@/types/reader";
import { isTouchDevice } from "@/lib/utils";
import { useIsPhone } from "@/hooks/use-mobile";

// Modo solo audiolibro: reproductor a pantalla completa (portada, capítulo,
// transporte, velocidad, volumen) + temporizador de autoapagado. El audio es
// el mismo <audio> de useAudiobook: entrar/salir del modo no corta la
// reproducción.

interface Props {
  state: AudiobookState;
  controls: AudiobookControls;
  theme: ReaderThemeColors;
  bookTitle?: string | null;
  coverPath?: string | null;
  aiChapterTitles?: string[];
  sleepTimer: SleepTimer;
  onExit: () => void;
}

const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SLEEP_MINUTES = [10, 15, 30, 45, 60];

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

type Popup = "none" | "speed" | "volume" | "sleep";

export default function AudiobookMode({
  state, controls, theme: t,
  bookTitle, coverPath, aiChapterTitles = [],
  sleepTimer, onExit,
}: Props) {
  const isPhone = useIsPhone();
  const [popup, setPopup] = useState<Popup>("none");

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
  const totalPct = state.duration > 0
    ? Math.min(100, (state.currentTime / state.duration) * 100)
    : 0;

  const hasChapters = state.chapters.length > 0;
  const hasPrev = idx > 0;
  const hasNext = idx < state.chapters.length - 1;

  const timerLabel = sleepTimerLabel(sleepTimer.timer);
  const dim = `${t.text}55`;

  // Esc sale del modo; espacio pausa/reanuda. En captura y cortando la
  // propagación para que el mapa de teclas del lector (Esc = salir de
  // pantalla completa) no reaccione también.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        onExit();
      } else if (e.key === " ") {
        e.preventDefault();
        e.stopImmediatePropagation();
        controls.togglePlay();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  });

  return (
    <div
      className="fixed inset-0 z-[130] flex flex-col"
      style={{ background: t.bg, color: t.text }}
      onClick={() => popup !== "none" && setPopup("none")}
    >
      {/* ── Cabecera ── */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          // Bajo el notch en iPhone: respeta el inset superior.
          padding: "max(14px, env(safe-area-inset-top, 0px)) 18px 14px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onExit}
          title={isTouchDevice ? "Volver a la lectura" : "Volver a la lectura (Esc)"}
          className="transition-opacity hover:opacity-60"
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontSize: "12px", fontWeight: 500, color: dim,
            padding: isTouchDevice ? "10px 14px" : "6px 10px",
            borderRadius: "99px",
            border: `1px solid ${t.text}15`,
          }}
        >
          <ChevronDown size={14} />
          <span>Volver a la lectura</span>
        </button>

        {timerLabel && (
          <button
            onClick={(e) => { e.stopPropagation(); setPopup(popup === "sleep" ? "none" : "sleep"); }}
            title="Temporizador activo"
            className="transition-opacity hover:opacity-75"
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: 600, color: t.link,
              padding: "6px 12px", borderRadius: "99px",
              background: `${t.link}14`, border: `1px solid ${t.link}30`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <Moon size={13} />
            {timerLabel}
          </button>
        )}
      </div>

      {/* ── Portada + títulos ── */}
      <div
        style={{
          flex: 1, minHeight: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "22px", padding: "0 24px",
        }}
      >
        {coverPath ? (
          <img
            src={coverPath}
            alt={bookTitle ?? ""}
            style={{
              maxHeight: "min(42vh, 380px)", maxWidth: "70vw",
              borderRadius: "14px", objectFit: "cover",
              boxShadow: `0 24px 60px -18px ${t.text}50`,
            }}
          />
        ) : (
          <div
            style={{
              height: "min(42vh, 380px)", aspectRatio: "2 / 3",
              maxWidth: "70vw",
              borderRadius: "14px",
              background: `linear-gradient(145deg, ${t.link}30, ${t.link}08, transparent)`,
              border: `1px solid ${t.text}12`,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "12px",
              padding: "16px", textAlign: "center",
            }}
          >
            <Headphones size={38} style={{ color: `${t.link}80` }} />
            <span style={{ fontSize: "12px", fontWeight: 600, color: `${t.text}70` }}>
              {bookTitle ?? state.fileName}
            </span>
          </div>
        )}

        <div style={{ textAlign: "center", maxWidth: "min(560px, 90vw)" }}>
          <p
            className="truncate"
            style={{ fontSize: "17px", fontWeight: 700, marginBottom: "4px" }}
          >
            {bookTitle ?? state.fileName ?? "Audiolibro"}
          </p>
          <p className="truncate" style={{ fontSize: "13px", color: dim }}>
            {chTitle || state.fileName}
            {hasChapters && (
              <span style={{ color: `${t.text}35` }}>
                {"  ·  "}{idx + 1} / {state.chapters.length}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Controles ── */}
      <div
        style={{
          width: "min(560px, calc(100% - 3rem))",
          margin: "0 auto", padding: "0 0 max(28px, env(safe-area-inset-bottom))",
          display: "flex", flexDirection: "column", gap: "18px", flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de progreso del capítulo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <SeekBar
            pct={chPct}
            theme={t}
            trackHeight={5}
            thumbAlways
            onSeekRatio={(r) => controls.seek(chStart + r * chDur)}
            previewTime={(r) => fmt(r * chDur)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: `${t.text}45`, fontVariantNumeric: "tabular-nums" }}>
            <span>{fmt(chElapsed)}</span>
            {hasChapters && state.duration > 0 && (
              <span style={{ color: `${t.text}30` }}>
                total {fmt(state.currentTime)} / {fmt(state.duration)} · {Math.round(totalPct)}%
              </span>
            )}
            <span>{fmt(chDur)}</span>
          </div>
        </div>

        {/* Transporte */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            // En táctil el gap cede con el ancho: en un móvil de 320-375px
            // los cinco botones con su zona pulsable no caben con 26px fijos.
            gap: isTouchDevice ? "clamp(6px, 3vw, 26px)" : "26px",
          }}
        >
          <BigGhost onClick={() => hasPrev && controls.goToChapter(idx - 1)} faded={!hasPrev || !hasChapters} color={t.text} title="Capítulo anterior">
            <SkipBack size={22} />
          </BigGhost>

          <BigGhost onClick={() => controls.skip(-10)} color={t.text} title="Retroceder 10 s">
            <span style={{ position: "relative", display: "inline-flex" }}>
              <RotateCcw size={24} />
              <span style={{ position: "absolute", fontSize: "7px", fontWeight: 700, bottom: "3px", right: "1px", lineHeight: 1 }}>10</span>
            </span>
          </BigGhost>

          <button
            onClick={controls.togglePlay}
            title={
              isTouchDevice
                ? state.isPlaying ? "Pausar" : "Reproducir"
                : state.isPlaying ? "Pausar (espacio)" : "Reproducir (espacio)"
            }
            style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: t.link, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "opacity .12s, transform .12s",
              boxShadow: `0 10px 28px -8px ${t.link}90`,
            }}
            className="hover:opacity-90 active:scale-95"
          >
            {state.isPlaying ? <Pause size={26} /> : <Play size={26} style={{ marginLeft: "3px" }} />}
          </button>

          <BigGhost onClick={() => controls.skip(10)} color={t.text} title="Avanzar 10 s">
            <span style={{ position: "relative", display: "inline-flex" }}>
              <RotateCw size={24} />
              <span style={{ position: "absolute", fontSize: "7px", fontWeight: 700, bottom: "3px", left: "1px", lineHeight: 1 }}>10</span>
            </span>
          </BigGhost>

          <BigGhost onClick={() => hasNext && controls.goToChapter(idx + 1)} faded={!hasNext || !hasChapters} color={t.text} title="Capítulo siguiente">
            <SkipForward size={22} />
          </BigGhost>
        </div>

        {/* Velocidad · volumen · temporizador */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>

          {/* Velocidad */}
          <div style={{ position: "relative" }}>
            {popup === "speed" && (
              <PopupCard t={t}>
                {RATES.map((r) => (
                  <button
                    key={r}
                    onClick={() => { controls.setRate(r); setPopup("none"); }}
                    style={{
                      fontSize: "12px", fontWeight: state.playbackRate === r ? 600 : 400,
                      padding: isTouchDevice ? "10px 12px" : "5px 10px",
                      borderRadius: "8px",
                      background: state.playbackRate === r ? `${t.link}20` : "transparent",
                      color: state.playbackRate === r ? t.link : `${t.text}60`,
                    }}
                  >
                    {r}×
                  </button>
                ))}
              </PopupCard>
            )}
            <PillBtn
              t={t}
              active={popup === "speed"}
              onClick={() => setPopup(popup === "speed" ? "none" : "speed")}
              title="Velocidad"
            >
              <Gauge size={14} />
              <span style={{ fontVariantNumeric: "tabular-nums" }}>{state.playbackRate}×</span>
            </PillBtn>
          </div>

          {/* Volumen — no en móvil: allí se usan los botones físicos
              (iOS además ignora los cambios de audio.volume). */}
          {!isPhone && (
          <div style={{ position: "relative" }}>
            {popup === "volume" && (
              <PopupCard t={t}>
                <VolumeX size={12} style={{ color: `${t.text}40`, flexShrink: 0 }} />
                <input
                  type="range" min={0} max={1} step={0.02}
                  value={volume}
                  onChange={(e) => controls.setVolume(Number(e.target.value))}
                  style={{
                    width: isTouchDevice ? "150px" : "110px",
                    height: isTouchDevice ? "6px" : "3px",
                    accentColor: t.link, cursor: "pointer",
                    background: `linear-gradient(to right, ${t.link} ${volume * 100}%, ${t.text}20 ${volume * 100}%)`,
                  }}
                />
                <Volume2 size={12} style={{ color: `${t.text}40`, flexShrink: 0 }} />
              </PopupCard>
            )}
            <PillBtn
              t={t}
              active={popup === "volume"}
              onClick={() => setPopup(popup === "volume" ? "none" : "volume")}
              title="Volumen"
            >
              <VolumeIcon size={14} />
            </PillBtn>
          </div>
          )}

          {/* Temporizador de apagado */}
          <div style={{ position: "relative" }}>
            {popup === "sleep" && (
              <PopupCard t={t} column>
                <span style={{ fontSize: "10px", fontWeight: 600, color: `${t.text}40`, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 4px" }}>
                  Apagar en
                </span>
                {SLEEP_MINUTES.map((m) => (
                  <SleepOption
                    key={m}
                    t={t}
                    active={sleepTimer.timer.mode === "minutes" && sleepTimer.timer.totalSec === m * 60}
                    onClick={() => { sleepTimer.startMinutes(m); setPopup("none"); }}
                  >
                    {m} min
                  </SleepOption>
                ))}
                <SleepOption
                  t={t}
                  active={sleepTimer.timer.mode === "chapter"}
                  disabled={!hasChapters}
                  onClick={() => { sleepTimer.startEndOfChapter(); setPopup("none"); }}
                >
                  Final del capítulo
                </SleepOption>
                {sleepTimer.timer.mode !== "off" && (
                  <SleepOption
                    t={t}
                    danger
                    onClick={() => { sleepTimer.cancel(); setPopup("none"); }}
                  >
                    Desactivar
                  </SleepOption>
                )}
              </PopupCard>
            )}
            <PillBtn
              t={t}
              active={popup === "sleep" || sleepTimer.timer.mode !== "off"}
              onClick={() => setPopup(popup === "sleep" ? "none" : "sleep")}
              title="Temporizador de apagado"
            >
              <Moon size={14} />
              {timerLabel && (
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{timerLabel}</span>
              )}
            </PillBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigGhost({ onClick, faded, color, title, children }: {
  onClick?: () => void; faded?: boolean; color: string; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={faded ? undefined : onClick}
      title={title}
      className="flex items-center justify-center rounded-full transition-opacity hover:opacity-50"
      style={{
        // En táctil, zona pulsable ~44px sin agrandar el icono.
        padding: isTouchDevice ? "10px" : "8px",
        opacity: faded ? 0.15 : 1,
        cursor: faded ? "default" : "pointer",
        color,
      }}
    >
      {children}
    </button>
  );
}

function PillBtn({ t, active, onClick, title, children }: {
  t: ReaderThemeColors; active?: boolean; onClick: () => void; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title}
      className="transition-opacity hover:opacity-75"
      style={{
        display: "flex", alignItems: "center", gap: "5px",
        fontSize: "12px", fontWeight: 500,
        padding: isTouchDevice ? "11px 16px" : "7px 13px",
        borderRadius: "99px",
        color: active ? t.link : `${t.text}55`,
        background: active ? `${t.link}14` : `${t.text}08`,
        border: `1px solid ${active ? `${t.link}30` : `${t.text}10`}`,
      }}
    >
      {children}
    </button>
  );
}

function PopupCard({ t, column, children }: {
  t: ReaderThemeColors; column?: boolean; children: React.ReactNode;
}) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute", bottom: "calc(100% + 10px)", left: "50%",
        transform: "translateX(-50%)",
        background: `${t.bg}f6`, border: `1px solid ${t.text}14`,
        borderRadius: "13px", backdropFilter: "blur(24px)",
        display: "flex", flexDirection: column ? "column" : "row",
        alignItems: column ? "stretch" : "center",
        gap: column ? "2px" : "8px",
        padding: column ? "8px" : "8px 12px",
        minWidth: column ? "160px" : undefined,
        boxShadow: `0 12px 32px -12px ${t.text}40`,
        zIndex: 10,
      }}
    >
      {children}
    </div>
  );
}

function SleepOption({ t, active, disabled, danger, onClick, children }: {
  t: ReaderThemeColors; active?: boolean; disabled?: boolean; danger?: boolean;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={disabled ? undefined : "hover:opacity-75 transition-opacity"}
      style={{
        fontSize: "12px", fontWeight: active ? 600 : 400,
        textAlign: "left",
        padding: isTouchDevice ? "11px 12px" : "6px 10px",
        borderRadius: "8px",
        background: active ? `${t.link}18` : "transparent",
        color: danger
          ? "#e5484d"
          : active ? t.link : disabled ? `${t.text}25` : `${t.text}75`,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
