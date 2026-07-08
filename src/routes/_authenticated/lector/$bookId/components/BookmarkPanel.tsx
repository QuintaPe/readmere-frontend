import { X, BookmarkPlus, Trash2, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BookmarkEntry, ReaderThemeColors } from "@/types/reader";

const AMBER = "#f59e0b";

interface BookmarkPanelProps {
  theme: ReaderThemeColors;
  bookmarks: BookmarkEntry[];
  onClose: () => void;
  onGoTo: (bm: BookmarkEntry) => void;
  onDelete: (id: string) => void;
}

export default function BookmarkPanel({
  theme: t,
  bookmarks,
  onClose,
  onGoTo,
  onDelete,
}: BookmarkPanelProps) {
  return (
    <div
      className="absolute inset-y-0 right-0 z-20 flex w-[88vw] flex-col border-l shadow-xl sm:w-80 lg:static lg:order-last lg:z-auto lg:shadow-none"
      style={{ background: t.bg, borderColor: `${t.text}1f` }}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-4 py-3"
        style={{ borderColor: `${t.text}14` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: t.text }}>
            Marcadores
          </span>
          {bookmarks.length > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{ background: `${t.link}1f`, color: t.link }}
            >
              {bookmarks.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 transition-opacity hover:opacity-70"
          style={{ background: `${t.text}10`, color: t.text }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="h-0 flex-1">
        <div className="space-y-2 p-3">
          {bookmarks.length === 0 ? (
            <div className="px-4 py-16 text-center text-xs" style={{ color: `${t.text}55` }}>
              <BookmarkPlus className="mx-auto mb-3 h-6 w-6" style={{ color: `${t.text}35` }} />
              Aún no tienes marcadores.
              <br />
              Selecciona una frase y guárdala aquí.
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="group overflow-hidden rounded-xl transition-colors"
                style={{ background: `${t.text}0a`, border: `1px solid ${t.text}14` }}
              >
                <button
                  className="w-full px-3.5 pt-3 pb-2.5 text-left"
                  onClick={() => {
                    onGoTo(bm);
                    onClose();
                  }}
                >
                  {/* Chapter */}
                  <div className="mb-2 flex items-center gap-1" style={{ color: t.link }}>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
                      {bm.chapter || "Sin capítulo"}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>

                  {/* Saved phrase */}
                  {bm.phrase && (
                    <blockquote
                      className="mb-2 select-none border-l-2 pl-3 font-serif text-[13px] italic leading-snug"
                      style={{ borderColor: AMBER, color: `${t.text}d9` }}
                    >
                      {bm.phrase}
                    </blockquote>
                  )}

                  {/* Note */}
                  {bm.note && (
                    <div className="text-[13px] font-semibold leading-snug" style={{ color: t.text }}>
                      {bm.note}
                    </div>
                  )}
                </button>

                {/* Footer: date + delete */}
                <div
                  className="flex items-center justify-between border-t px-3.5 py-2"
                  style={{ borderColor: `${t.text}0d` }}
                >
                  <span className="text-[10px] tabular-nums" style={{ color: `${t.text}45` }}>
                    {new Date(bm.createdAt).toLocaleDateString("es", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <button
                    onClick={() => onDelete(bm.id)}
                    className="rounded-md p-1 transition-opacity hover:opacity-100 opacity-60"
                    style={{ color: `${t.text}55` }}
                    title="Eliminar marcador"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
