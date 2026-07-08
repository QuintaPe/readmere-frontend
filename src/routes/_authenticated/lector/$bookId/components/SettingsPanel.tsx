import {
  X,
  Sun,
  Moon,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  AlignRight,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  FONT_MAP,
  THEMES,
  defaultSettings,
  saveSettings,
} from "../lib/reader-theme";
import type {
  ReaderSettings,
  ReaderTheme,
  FontFamily,
  TextAlign,
  ReaderThemeColors,
} from "@/types/reader";

interface SettingsPanelProps {
  theme: ReaderThemeColors;
  settings: ReaderSettings;
  onUpdate: (patch: Partial<ReaderSettings>) => void;
  onClose: () => void;
  onApply: (s: ReaderSettings) => void;
  onSetSettings: (s: ReaderSettings) => void;
}

export default function SettingsPanel({
  theme: t,
  settings,
  onUpdate,
  onClose,
  onApply,
  onSetSettings,
}: SettingsPanelProps) {
  return (
    <div
      className="absolute inset-y-0 right-0 z-20 w-[88vw] overflow-y-auto border-l shadow-xl sm:w-80 lg:static lg:order-last lg:z-auto lg:shadow-none"
      style={{ background: t.bg, borderColor: "rgba(128,128,128,0.2)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "rgba(128,128,128,0.2)" }}
      >
        <span className="text-sm font-semibold" style={{ color: t.text }}>
          Ajustes de lectura
        </span>
        <button
          onClick={onClose}
          className="rounded p-1"
          style={{ color: t.text }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-4 space-y-6">
        {/* Theme */}
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50"
            style={{ color: t.text }}
          >
            Tema
          </p>
          <div className="flex gap-2">
            {(["dark", "light", "sepia"] as ReaderTheme[]).map((th) => (
              <button
                key={th}
                onClick={() => onUpdate({ theme: th })}
                className="flex-1 rounded-lg py-2 text-xs font-medium border transition-all"
                style={{
                  fontFamily: FONT_MAP["sans"],
                  background: THEMES[th].bg,
                  color: THEMES[th].text,
                  borderColor:
                    settings.theme === th ? t.link : "rgba(128,128,128,0.3)",
                  borderWidth: settings.theme === th ? 2 : 1,
                }}
              >
                {th === "dark" ? (
                  <Moon className="mx-auto h-4 w-4" />
                ) : th === "light" ? (
                  <Sun className="mx-auto h-4 w-4" />
                ) : (
                  <span className="text-base">Aa</span>
                )}
                <div className="mt-1">
                  {th === "dark"
                    ? "Oscuro"
                    : th === "light"
                      ? "Claro"
                      : "Sepia"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Font size */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider opacity-50"
              style={{ color: t.text }}
            >
              Tamaño
            </p>
            <span className="text-xs tabular-nums" style={{ color: t.link }}>
              {settings.fontSize}%
            </span>
          </div>
          <Slider
            min={70}
            max={200}
            step={5}
            value={[settings.fontSize]}
            onValueChange={([v]) => onUpdate({ fontSize: v })}
          />
          <div
            className="flex justify-between mt-1 text-[10px] opacity-40"
            style={{ color: t.text }}
          >
            <span>A</span>
            <span style={{ fontSize: "1.2em" }}>A</span>
          </div>
        </div>

        {/* Font family */}
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50"
            style={{ color: t.text }}
          >
            Fuente
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "sans" as FontFamily, label: "Sans" },
              { id: "serif" as FontFamily, label: "Serif" },
              { id: "mono" as FontFamily, label: "Mono" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onUpdate({ fontFamily: id })}
                className="rounded-lg py-2 px-1 text-center border transition-all"
                style={{
                  fontFamily: FONT_MAP[id],
                  background:
                    settings.fontFamily === id ? `${t.link}22` : "transparent",
                  color: t.text,
                  borderColor:
                    settings.fontFamily === id
                      ? t.link
                      : "rgba(128,128,128,0.3)",
                  borderWidth: settings.fontFamily === id ? 2 : 1,
                }}
              >
                <div className="text-base">Aa</div>
                <div className="text-[10px] mt-0.5 opacity-70">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Line height */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider opacity-50"
              style={{ color: t.text }}
            >
              Interlineado
            </p>
            <span className="text-xs tabular-nums" style={{ color: t.link }}>
              {settings.lineHeight.toFixed(1)}
            </span>
          </div>
          <Slider
            min={1.2}
            max={2.8}
            step={0.1}
            value={[settings.lineHeight]}
            onValueChange={([v]) => onUpdate({ lineHeight: v })}
          />
          <div
            className="flex justify-between mt-1 text-[10px] opacity-40"
            style={{ color: t.text }}
          >
            <span>Compacto</span>
            <span>Espacioso</span>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-50"
            style={{ color: t.text }}
          >
            Alineación
          </p>
          <div className="flex gap-2">
            {[
              { id: "left" as TextAlign, icon: AlignLeft, label: "Izq." },
              {
                id: "justify" as TextAlign,
                icon: AlignJustify,
                label: "Just.",
              },
              { id: "center" as TextAlign, icon: AlignCenter, label: "Centro" },
              { id: "right" as TextAlign, icon: AlignRight, label: "Dcha." },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => onUpdate({ textAlign: id })}
                className="flex-1 rounded-lg py-2 flex flex-col items-center gap-1 border transition-all"
                style={{
                  background:
                    settings.textAlign === id ? `${t.link}22` : "transparent",
                  color: settings.textAlign === id ? t.link : t.text,
                  borderColor:
                    settings.textAlign === id
                      ? t.link
                      : "rgba(128,128,128,0.3)",
                  borderWidth: settings.textAlign === id ? 2 : 1,
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Margins */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider opacity-50"
              style={{ color: t.text }}
            >
              Márgenes
            </p>
            <span className="text-xs tabular-nums" style={{ color: t.link }}>
              {settings.marginH}%
            </span>
          </div>
          <Slider
            min={0}
            max={20}
            step={1}
            value={[settings.marginH]}
            onValueChange={([v]) => onUpdate({ marginH: v })}
          />
          <div
            className="flex justify-between mt-1 text-[10px] opacity-40"
            style={{ color: t.text }}
          >
            <span>Sin margen</span>
            <span>Amplio</span>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            const d = defaultSettings();
            saveSettings(d);
            onSetSettings(d);
            onApply(d);
          }}
          className="w-full text-xs py-2 rounded-lg border"
          style={{
            color: t.text,
            borderColor: "rgba(128,128,128,0.3)",
            opacity: 0.6,
          }}
        >
          Restablecer valores
        </button>
      </div>
    </div>
  );
}
