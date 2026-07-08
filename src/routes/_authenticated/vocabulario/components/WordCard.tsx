import { srsToLevel, levelColor, isLeech } from "@/lib/srs";
import { speak } from "@/lib/speech";
import { Volume2, Search, EyeOff, Eye, Trash2, Bug } from "lucide-react";
import type { Word } from "@/types";

function srsDueLabel(due: string): { label: string; urgent: boolean } {
  const d = new Date(due);
  const now = new Date();
  const diff = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return { label: "Hoy", urgent: true };
  if (diff === 1) return { label: "Mañana", urgent: false };
  if (diff < 7) return { label: `${diff}d`, urgent: false };
  return {
    label: d.toLocaleDateString("es", { day: "numeric", month: "short" }),
    urgent: false,
  };
}

interface WordCardProps {
  word: Word;
  isSelected: boolean;
  onToggleSelect: () => void;
  onOpenDetail: () => void;
  onToggleIgnore: () => void;
  onDelete: () => void;
}

export default function WordCard({
  word: w,
  isSelected,
  onToggleSelect,
  onOpenDetail,
  onToggleIgnore,
  onDelete,
}: WordCardProps) {
  const level = srsToLevel(w.srsInterval, w.srsReps);
  const color = w.status === "ignored" ? "#6b7280" : levelColor(level);
  const due = srsDueLabel(w.srsDue);

  return (
    <div
      onClick={onToggleSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.99] ${
        isSelected
          ? "border-primary/40 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-border/80"
      }`}
    >
      <div
        className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl transition-all"
        style={{ background: color }}
      />

      <div className="px-5 py-4 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold tracking-tight">
                {w.term}
              </span>
              {w.phonetic && (
                <span className="text-[11px] text-muted-foreground/40">
                  {w.phonetic}
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {w.translation && (
                <span className="text-sm text-muted-foreground">
                  {w.translation}
                </span>
              )}
              {w.partOfSpeech && (
                <>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="text-xs text-muted-foreground/50">
                    {w.partOfSpeech}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: color }}
            >
              {w.status === "ignored" ? "–" : level}
            </div>
            <span
              className={`text-[11px] font-medium ${due.urgent && w.status !== "ignored" ? "text-primary" : "text-muted-foreground/35"}`}
            >
              {w.status === "ignored" ? "off" : due.label}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {w.difficulty && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {w.difficulty}
              </span>
            )}
            {isLeech(w) && w.status !== "ignored" && (
              <span
                className="flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-500"
                title={`Se te resiste: ${w.srsLapses} fallos. Prueba a mejorar el ejemplo o suspéndela.`}
              >
                <Bug className="h-3 w-3" /> difícil
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 touch:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => speak(w.term, w.language || "en")}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground touch:p-2.5"
              title="Pronunciar"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail();
              }}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground touch:p-2.5"
              title="Ver detalle"
            >
              <Search className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onToggleIgnore}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground touch:p-2.5"
            >
              {w.status === "ignored" ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive touch:p-2.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
