import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chapter, ReaderThemeColors } from "@/types/reader";

interface TocPanelProps {
  theme: ReaderThemeColors;
  chapters: Chapter[];
  currentChapter: string;
  onClose: () => void;
  onGoToChapter: (href: string) => void;
}

export default function TocPanel({
  theme: t,
  chapters,
  currentChapter,
  onClose,
  onGoToChapter,
}: TocPanelProps) {
  return (
    <div
      className="absolute inset-y-0 right-0 z-20 flex w-[88vw] flex-col border-l shadow-xl sm:w-72 lg:static lg:order-last lg:z-auto lg:shadow-none"
      style={{ background: t.bg, borderColor: "rgba(128,128,128,0.2)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(128,128,128,0.2)" }}
      >
        <span className="text-sm font-semibold" style={{ color: t.text }}>
          Capítulos
        </span>
        <button
          onClick={onClose}
          className="rounded p-1"
          style={{ color: t.text }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="p-2">
          {chapters.length === 0 ? (
            <div className="p-4 text-xs opacity-50" style={{ color: t.text }}>
              No se encontraron capítulos
            </div>
          ) : (
            chapters.map((ch, i) => (
              <button
                key={i}
                onClick={() => onGoToChapter(ch.href)}
                style={{
                  paddingLeft: `${0.75 + ch.depth * 0.9}rem`,
                  color:
                    ch.label === currentChapter
                      ? t.link
                      : ch.depth === 0
                        ? t.text
                        : `${t.text}99`,
                  background:
                    ch.label === currentChapter ? `${t.link}22` : "transparent",
                }}
                className="w-full rounded-md py-2 pr-3 text-left text-sm transition-colors hover:opacity-80"
              >
                {ch.label}
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
