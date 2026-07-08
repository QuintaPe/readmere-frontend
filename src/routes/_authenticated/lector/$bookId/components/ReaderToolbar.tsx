import { Link } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Settings2,
  List,
  Search,
  Bookmark,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Tip from "./Tip";
import type { ReaderThemeColors } from "@/types/reader";

interface ReaderToolbarProps {
  theme: ReaderThemeColors;
  ready: boolean;
  toolbarVisible: boolean;
  fullscreen: boolean;
  currentChapter: string;
  bookTitle: string | undefined;
  currentChapterIdx: number;
  chaptersLength: number;
  bookmarksCount: number;
  showSearch: boolean;
  showBookmarks: boolean;
  showSettings: boolean;
  showToc: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onToggleSearch: () => void;
  onToggleBookmarks: () => void;
  onToggleSettings: () => void;
  onToggleToc: () => void;
  onToggleFullscreen: () => void;
  onMouseEnter: () => void;
}

export default function ReaderToolbar({
  theme: t,
  ready,
  toolbarVisible,
  fullscreen,
  currentChapter,
  bookTitle,
  currentChapterIdx,
  chaptersLength,
  bookmarksCount,
  showSearch,
  showBookmarks,
  showSettings,
  showToc,
  onPrevChapter,
  onNextChapter,
  onToggleSearch,
  onToggleBookmarks,
  onToggleSettings,
  onToggleToc,
  onToggleFullscreen,
  onMouseEnter,
}: ReaderToolbarProps) {
  return (
    <TooltipProvider delayDuration={400}>
      <div
        className="flex items-center gap-2 px-3 py-2 border-b shrink-0 transition-transform duration-300"
        style={{
          borderColor: "rgba(128,128,128,0.2)",
          background: `${t.bg}f0`,
          transform: toolbarVisible ? "translateY(0)" : "translateY(-100%)",
          marginBottom: toolbarVisible ? 0 : "-44px",
        }}
        onMouseEnter={onMouseEnter}
      >
        <Link to="/lector" viewTransition>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 shrink-0"
            style={{ color: t.text }}
          >
            <ArrowLeft className="h-4 w-4" />{" "}
            <span className="hidden sm:inline">Biblioteca</span>
          </Button>
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <Tip label="Capítulo anterior" shortcut="←">
            <button
              onClick={onPrevChapter}
              disabled={!ready || currentChapterIdx <= 0}
              className="rounded-md p-1.5 transition-colors touch:p-2.5 disabled:opacity-30"
              style={{ color: t.text }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${t.text}18`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Tip>
          <Tip label="Capítulo siguiente" shortcut="→">
            <button
              onClick={onNextChapter}
              disabled={!ready || currentChapterIdx >= chaptersLength - 1}
              className="rounded-md p-1.5 transition-colors touch:p-2.5 disabled:opacity-30"
              style={{ color: t.text }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${t.text}18`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </Tip>
        </div>

        <div
          className="flex-1 truncate text-center text-xs font-medium"
          style={{ color: t.link }}
        >
          {currentChapter || bookTitle || "Cargando..."}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Tip label="Buscar en el libro" shortcut="Ctrl+F">
            <button
              onClick={onToggleSearch}
              className="rounded-md p-1.5 transition-colors touch:p-2.5"
              style={{
                color: showSearch ? t.link : t.text,
                background: showSearch ? `${t.link}20` : "transparent",
              }}
            >
              <Search className="h-4 w-4" />
            </button>
          </Tip>
          <Tip label="Marcadores">
            <button
              onClick={onToggleBookmarks}
              className="rounded-md p-1.5 transition-colors touch:p-2.5"
              style={{
                color: showBookmarks ? t.link : t.text,
                background: showBookmarks ? `${t.link}20` : "transparent",
              }}
            >
              <Bookmark
                className="h-4 w-4"
                style={{ fill: bookmarksCount > 0 ? `${t.link}60` : "none" }}
              />
            </button>
          </Tip>
          <Tip label="Ajustes de lectura">
            <button
              onClick={onToggleSettings}
              className="rounded-md p-1.5 transition-colors touch:p-2.5"
              style={{
                color: showSettings ? t.link : t.text,
                background: showSettings ? `${t.link}20` : "transparent",
              }}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </Tip>
          <Tip label="Capítulos">
            <button
              onClick={onToggleToc}
              className="rounded-md p-1.5 transition-colors touch:p-2.5"
              style={{
                color: showToc ? t.link : t.text,
                background: showToc ? `${t.link}20` : "transparent",
              }}
            >
              <List className="h-4 w-4" />
            </button>
          </Tip>
          <Tip
            label={
              fullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
            shortcut={fullscreen ? "Esc" : "F"}
          >
            <button
              onClick={onToggleFullscreen}
              className="rounded-md p-1.5 transition-colors touch:p-2.5"
              style={{
                color: fullscreen ? t.link : t.text,
                background: fullscreen ? `${t.link}20` : "transparent",
              }}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </Tip>
        </div>
      </div>
    </TooltipProvider>
  );
}
