import { X, Bookmark } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { ReaderThemeColors } from "@/types/reader";

const AMBER = "#f59e0b";

interface AddBookmarkDialogProps {
  theme: ReaderThemeColors;
  phrase: string;
  note: string;
  onNoteChange: (note: string) => void;
  onSave: () => void;
  onClose: () => void;
  raised?: boolean;
}

export default function AddBookmarkDialog({
  theme: t,
  phrase,
  note,
  onNoteChange,
  onSave,
  onClose,
  raised = false,
}: AddBookmarkDialogProps) {
  return (
    <div
      className={`popup-rise absolute left-1/2 z-40 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl ${
        raised ? "bottom-28" : "bottom-4"
      }`}
      style={{
        background: t.bg,
        border: `1px solid ${t.text}18`,
        color: t.text,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${t.text}10` }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-8 w-8 place-items-center rounded-full"
            style={{ background: "rgba(245,158,11,0.15)", color: AMBER }}
          >
            <Bookmark className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">Añadir marcador</span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 transition-opacity hover:opacity-70"
          style={{ background: `${t.text}10`, color: t.text }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="space-y-3 px-5 py-4">
        {phrase && (
          <blockquote
            className="select-none border-l-2 py-0.5 pl-4 font-serif text-[15px] italic leading-relaxed"
            style={{ borderColor: AMBER, color: `${t.text}e6` }}
          >
            {phrase}
          </blockquote>
        )}

        <Textarea
          placeholder="Nota opcional…"
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={2}
          autoFocus
          className="resize-none text-sm"
          style={{
            background: `${t.text}0d`,
            color: t.text,
            borderColor: `${t.text}22`,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSave();
            }
          }}
        />
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <button
          onClick={onSave}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: t.link, color: t.selText }}
        >
          <Bookmark className="h-4 w-4" /> Guardar marcador
        </button>
      </div>
    </div>
  );
}
