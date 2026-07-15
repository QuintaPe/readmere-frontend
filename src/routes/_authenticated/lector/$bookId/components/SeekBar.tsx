import { useRef, useState } from "react";
import type { ReaderThemeColors } from "@/types/reader";

// Barra de progreso con scrubbing táctil: la pista visual es fina, pero la
// zona interactiva se amplía con padding (y margen negativo para no alterar
// el layout), de modo que en móvil se pueda dar con el dedo sin puntería.
// Arrastrar mueve la posición en vivo (con burbuja de tiempo) y el seek real
// se hace al soltar; un toque suelto sigue funcionando como clic.

interface Props {
  /** Posición actual, 0–100. */
  pct: number;
  theme: ReaderThemeColors;
  /** Alto visual de la pista en px. */
  trackHeight?: number;
  /** Margen táctil extra por encima y debajo de la pista, en px. */
  touchPadding?: number;
  /** Mostrar siempre el tirador (si no, sólo al pasar el ratón o arrastrar). */
  thumbAlways?: boolean;
  /** Se llama al soltar con la posición elegida, 0–1. */
  onSeekRatio: (ratio: number) => void;
  /** Texto de la burbuja mientras se arrastra (p. ej. el tiempo). */
  previewTime?: (ratio: number) => string;
}

export default function SeekBar({
  pct, theme: t, trackHeight = 4, touchPadding = 14,
  thumbAlways, onSeekRatio, previewTime,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragPct, setDragPct] = useState<number | null>(null);

  const ratioFrom = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - r.left) / r.width));
  };

  const dragging = dragPct !== null;
  const shownPct = dragPct ?? Math.max(0, Math.min(100, pct));

  return (
    <div
      className="group"
      style={{
        // Zona táctil generosa sin ocupar más sitio en el layout.
        padding: `${touchPadding}px 0`,
        margin: `-${touchPadding}px 0`,
        cursor: "pointer",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragPct(ratioFrom(e.clientX) * 100);
      }}
      onPointerMove={(e) => {
        if (dragging) setDragPct(ratioFrom(e.clientX) * 100);
      }}
      onPointerUp={(e) => {
        if (!dragging) return;
        onSeekRatio(ratioFrom(e.clientX));
        setDragPct(null);
      }}
      onPointerCancel={() => setDragPct(null)}
    >
      <div
        ref={trackRef}
        style={{
          position: "relative",
          height: `${trackHeight}px`,
          borderRadius: "99px",
          background: `${t.text}16`,
        }}
      >
        <div
          style={{
            position: "absolute", top: 0, left: 0, bottom: 0,
            width: `${shownPct}%`, borderRadius: "99px", background: t.link,
          }}
        />
        <div
          className={
            thumbAlways || dragging
              ? undefined
              : "opacity-0 group-hover:opacity-100 transition-opacity"
          }
          style={{
            position: "absolute", top: "50%", left: `${shownPct}%`,
            width: dragging ? "15px" : "12px",
            height: dragging ? "15px" : "12px",
            borderRadius: "50%",
            background: t.text,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 1px 6px ${t.text}40`,
            pointerEvents: "none",
            transition: "width .1s, height .1s",
          }}
        />
        {dragging && previewTime && (
          <div
            style={{
              position: "absolute", bottom: "calc(100% + 14px)", left: `${shownPct}%`,
              transform: "translateX(-50%)",
              background: `${t.bg}f6`, border: `1px solid ${t.text}20`,
              borderRadius: "8px", padding: "3px 8px",
              fontSize: "11px", fontWeight: 600, color: t.text,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap", pointerEvents: "none",
              boxShadow: `0 6px 18px -6px ${t.text}50`,
            }}
          >
            {previewTime(shownPct / 100)}
          </div>
        )}
      </div>
    </div>
  );
}
