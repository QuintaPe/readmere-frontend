import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useWords, useBooks, useDeckList } from "@/hooks/useCollections";
import { Search, BookOpen, Layers, BookText } from "lucide-react";

interface Result {
  id: string;
  group: "Palabras" | "Libros" | "Mazos";
  label: string;
  sublabel?: string;
  to: string;
}

const MAX_PER_GROUP = 6;

// El contenido vive en su propio componente para que los datos (palabras,
// libros, mazos) solo se pidan cuando el buscador se abre por primera vez.
function SearchContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { words } = useWords();
  const { books } = useBooks();
  const { decks } = useDeckList();

  const results = useMemo<Result[]>(() => {
    const lq = q.trim().toLowerCase();
    if (!lq) return [];
    const out: Result[] = [];
    for (const w of words) {
      if (out.filter((r) => r.group === "Palabras").length >= MAX_PER_GROUP)
        break;
      if (
        w.term.toLowerCase().includes(lq) ||
        (w.translation ?? "").toLowerCase().includes(lq)
      )
        out.push({
          id: `w-${w.id}`,
          group: "Palabras",
          label: w.term,
          sublabel: w.translation ?? undefined,
          to: `/vocabulario?q=${encodeURIComponent(w.term)}`,
        });
    }
    for (const b of books) {
      if (out.filter((r) => r.group === "Libros").length >= MAX_PER_GROUP)
        break;
      if (
        b.title.toLowerCase().includes(lq) ||
        (b.author ?? "").toLowerCase().includes(lq)
      )
        out.push({
          id: `b-${b.id}`,
          group: "Libros",
          label: b.title,
          sublabel: b.author ?? undefined,
          to: `/lector/${b.id}`,
        });
    }
    for (const d of decks) {
      if (out.filter((r) => r.group === "Mazos").length >= MAX_PER_GROUP) break;
      if (d.name.toLowerCase().includes(lq))
        out.push({
          id: `d-${d.id}`,
          group: "Mazos",
          label: d.name,
          to: `/mazos/${d.id}`,
        });
    }
    return out;
  }, [q, words, books, decks]);

  function go(r: Result) {
    onClose();
    navigate(r.to, { viewTransition: true });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && results[highlight]) {
      e.preventDefault();
      go(results[highlight]);
    }
  }

  const icons = { Palabras: BookText, Libros: BookOpen, Mazos: Layers } as const;
  let lastGroup = "";

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-2 border-b border-border px-4 pb-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            // Nueva búsqueda → resaltar el primer resultado (antes en un
            // useEffect, que provocaba un render extra en cascada).
            setHighlight(0);
          }}
          placeholder="Buscar palabras, libros, mazos…"
          className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="touch:hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          esc
        </kbd>
      </div>
      <div className="max-h-80 overflow-y-auto p-2">
        {q && results.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Sin resultados para "{q}"
          </p>
        )}
        {results.map((r, i) => {
          const showHeader = r.group !== lastGroup;
          lastGroup = r.group;
          const Icon = icons[r.group];
          return (
            <div key={r.id}>
              {showHeader && (
                <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {r.group}
                </p>
              )}
              <button
                onClick={() => go(r)}
                onMouseEnter={() => setHighlight(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                  i === highlight ? "bg-accent" : ""
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                {r.sublabel && (
                  <span className="max-w-[40%] truncate text-xs text-muted-foreground">
                    {r.sublabel}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Buscar</span>
        <kbd className="touch:hidden rounded border border-border bg-background px-1 text-[10px]">
          Ctrl K
        </kbd>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-0 p-0 pt-4 sm:max-w-lg">
          <DialogTitle className="sr-only">Búsqueda global</DialogTitle>
          {open && <SearchContent onClose={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
