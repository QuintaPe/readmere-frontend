import { useState } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { escapeRegex } from "../lib/epub-highlight";
import type { ReaderThemeColors } from "@/types/reader";

interface SearchResult {
  cfi: string;
  excerpt: string;
  chapter: string;
}

interface SearchPanelProps {
  theme: ReaderThemeColors;
  results: SearchResult[];
  loading: boolean;
  onClose: () => void;
  onGoToResult: (cfi: string) => void;
  onSearch: (query: string) => void;
}

export default function SearchPanel({
  theme: t,
  results,
  loading,
  onClose,
  onGoToResult,
  onSearch,
}: SearchPanelProps) {
  const [query, setQuery] = useState("");

  return (
    <div
      className="absolute inset-y-0 right-0 z-20 flex w-[88vw] flex-col border-l shadow-xl sm:w-80 lg:static lg:order-last lg:z-auto lg:shadow-none"
      style={{ background: t.bg, borderColor: "rgba(128,128,128,0.2)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(128,128,128,0.2)" }}
      >
        <span className="text-sm font-semibold" style={{ color: t.text }}>
          Buscar en el libro
        </span>
        <button
          onClick={onClose}
          className="rounded p-1"
          style={{ color: t.text }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div
        className="px-3 py-2 border-b shrink-0"
        style={{ borderColor: "rgba(128,128,128,0.2)" }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(query);
          }}
          className="flex gap-2"
        >
          <Input
            autoFocus
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 text-sm flex-1"
            style={{
              background: `${t.text}0d`,
              color: t.text,
              borderColor: `${t.text}25`,
            }}
          />
          <button
            type="submit"
            className="rounded-md px-2.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: t.link, color: t.selText }}
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
      <ScrollArea className="flex-1 h-0">
        <div className="p-2">
          {loading && (
            <div
              className="flex items-center gap-2 p-4 text-xs"
              style={{ color: `${t.text}60` }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buscando...
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div
              className="p-4 text-xs opacity-50 text-center"
              style={{ color: t.text }}
            >
              Sin resultados
            </div>
          )}
          {!loading && results.length === 0 && !query && (
            <div
              className="p-4 text-xs opacity-40 text-center"
              style={{ color: t.text }}
            >
              Escribe y pulsa Enter para buscar
            </div>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => onGoToResult(r.cfi)}
              className="w-full rounded-md px-3 py-2 text-left transition-colors hover:opacity-80 mb-1"
              style={{ background: `${t.text}0a` }}
            >
              {r.chapter && (
                <div
                  className="text-[10px] font-medium mb-0.5 truncate"
                  style={{ color: t.link }}
                >
                  {r.chapter}
                </div>
              )}
              <div
                className="text-xs leading-relaxed line-clamp-3"
                style={{ color: `${t.text}cc` }}
                dangerouslySetInnerHTML={{
                  __html: r.excerpt.replace(
                    new RegExp(`(${escapeRegex(query)})`, "gi"),
                    `<mark style="background:${t.link}40;color:inherit;border-radius:2px;padding:0 1px">$1</mark>`,
                  ),
                }}
              />
            </button>
          ))}
          {results.length === 50 && (
            <div
              className="text-center text-[10px] py-2 opacity-40"
              style={{ color: t.text }}
            >
              Mostrando los primeros 50 resultados
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
