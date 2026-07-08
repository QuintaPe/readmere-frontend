import { useState, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createWordsBatch, updateWord, deleteWord } from "@/modules/words";
import { addWordToDeck } from "@/modules/decks";
import { useWords, useBooks, useDeckList, invalidateWords } from "@/hooks/useCollections";
import {
  exportWordsCsv,
  exportWordsAnki,
  parseWordsCsv,
} from "./lib/word-transfer";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { useEnrichWords } from "./hooks/useEnrichWords";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Download,
  Upload,
  Layers,
  BookOpen,
  Search,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { srsToLevel, isLeech } from "@/lib/srs";
import WordCard from "./components/WordCard";
import WordDetailSheet from "./components/WordDetailSheet";
import AddWordDialog from "./components/AddWordDialog";
import type { Word } from "@/types";

const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

export default function VocabularyPage() {
  // ?q= permite llegar con la búsqueda ya puesta (p. ej. desde la búsqueda global)
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") ?? "");
  // Si la URL cambia con la página ya montada (nueva búsqueda global),
  // adoptar el nuevo ?q=. Ajuste durante el render, no setState en efecto.
  const urlQ = searchParams.get("q");
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    if (urlQ) setQ(urlQ);
  }
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [bookFilter, setBookFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "due" | "alpha">("recent");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deckOpen, setDeckOpen] = useState(false);
  const [detailWord, setDetailWord] = useState<Word | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { pendingDelete, queueDelete } = useUndoableDelete({
    onDelete: deleteWord,
    onDeleted: invalidateWords,
    label: "Palabra eliminada",
  });
  const { enriching, enrichWords } = useEnrichWords();

  const { words, loading } = useWords();
  const { books } = useBooks();
  const { decks: rawDecks } = useDeckList();
  const decks = useMemo(
    () => [...rawDecks].sort((a, b) => a.name.localeCompare(b.name)),
    [rawDecks],
  );
  const invalidate = invalidateWords;

  const sourceBooks = useMemo(() => {
    const ids = new Set<string>(
      words.map((w) => w.sourceBookId).filter(Boolean) as string[],
    );
    return books.filter((b) => ids.has(b.id));
  }, [words, books]);

  const levelGroups = useMemo(() => {
    const g = { all: words.length, "1-3": 0, "4-6": 0, "7-9": 0, "10": 0, leech: 0 };
    for (const w of words) {
      const lv = srsToLevel(w.srsInterval, w.srsReps);
      if (lv <= 3) g["1-3"]++;
      else if (lv <= 6) g["4-6"]++;
      else if (lv <= 9) g["7-9"]++;
      else g["10"]++;
      if (isLeech(w) && w.status !== "ignored") g.leech++;
    }
    return g;
  }, [words]);

  const languages = useMemo(
    () => [...new Set<string>(words.map((w) => w.language))].sort(),
    [words],
  );

  const filtered = useMemo(() => {
    let list = words.filter((w) => !pendingDelete.has(w.id));
    if (levelFilter !== "all") {
      list = list.filter((w) => {
        const lv = srsToLevel(w.srsInterval, w.srsReps);
        if (levelFilter === "1-3") return lv <= 3;
        if (levelFilter === "4-6") return lv >= 4 && lv <= 6;
        if (levelFilter === "7-9") return lv >= 7 && lv <= 9;
        if (levelFilter === "10") return lv === 10;
        if (levelFilter === "leech") return isLeech(w) && w.status !== "ignored";
        return true;
      });
    }
    if (langFilter !== "all")
      list = list.filter((w) => w.language === langFilter);
    if (bookFilter !== "all")
      list = list.filter((w) => w.sourceBookId === bookFilter);
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(
        (w) =>
          w.term.toLowerCase().includes(lq) ||
          (w.translation ?? "").toLowerCase().includes(lq) ||
          (w.definition ?? "").toLowerCase().includes(lq),
      );
    }
    if (sortBy === "recent")
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "due") list.sort((a, b) => a.srsDue.localeCompare(b.srsDue));
    if (sortBy === "alpha") list.sort((a, b) => a.term.localeCompare(b.term));
    return list;
  }, [words, q, levelFilter, langFilter, bookFilter, sortBy, pendingDelete]);

  function handleDeleteWord(id: string) {
    if (!queueDelete(id)) return;
    if (detailWord?.id === id) setDetailWord(null);
  }

  async function toggleIgnore(id: string, currentStatus: string) {
    const status = currentStatus === "ignored" ? "new" : "ignored";
    try {
      await updateWord(id, { status });
      invalidate();
      if (detailWord?.id === id)
        setDetailWord((w) => (w ? { ...w, status } : null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al actualizar");
    }
  }

  function exportCsv() {
    exportWordsCsv(filtered);
  }

  function exportAnki() {
    exportWordsAnki(filtered);
    toast.success(`${filtered.length} tarjetas exportadas para Anki`);
  }

  async function importCsv(file: File) {
    const parsed = parseWordsCsv(await file.text());
    if ("error" in parsed) return toast.error(parsed.error);
    // Una sola request para todo el archivo; el servidor salta duplicados.
    try {
      const { imported } = await createWordsBatch(parsed.rows);
      toast.success(`${imported} palabras importadas`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al importar");
    }
    invalidate();
  }

  function toggleSel(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function enrichSelected() {
    const ok = await enrichWords(words.filter((w) => selected.has(w.id)));
    if (ok) {
      setSelected(new Set());
      invalidate();
    }
  }

  async function addSelectedToDeck(deckId: string) {
    if (!selected.size) return;
    let ok = 0;
    for (const wid of Array.from(selected)) {
      try {
        await addWordToDeck(deckId, wid);
        ok++;
      } catch {
        /* skip */
      }
    }
    toast.success(`${ok} añadidas al mazo`);
    setSelected(new Set());
    setDeckOpen(false);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl" style={display}>
            Vocabulario
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {words.length} {words.length === 1 ? "palabra" : "palabras"}
            {selected.size > 0 && ` · ${selected.size} seleccionadas`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={enriching}
              onClick={enrichSelected}
              title="Rellena con IA los campos vacíos (fonética, ejemplo, sinónimos...) de las palabras seleccionadas"
            >
              {enriching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Completar con IA
            </Button>
          )}
          {selected.size > 0 && (
            <Dialog open={deckOpen} onOpenChange={setDeckOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" /> A mazo ({selected.size})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir a mazo</DialogTitle>
                </DialogHeader>
                {decks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aún no tienes mazos.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {decks.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => addSelectedToDeck(d.id)}
                        className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-accent"
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-sm">{d.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importCsv(f);
              e.target.value = "";
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            className="gap-2"
          >
            <Upload className="h-4 w-4" /> Importar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAnki}
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Anki
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Añadir
              </Button>
            </DialogTrigger>
            <AddWordDialog
              onDone={() => {
                setOpen(false);
                invalidate();
              }}
            />
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", label: "Todas", color: "#5b7cff" },
            { key: "1-3", label: "Nivel 1–3", color: "#f97316" },
            { key: "4-6", label: "Nivel 4–6", color: "#eab308" },
            { key: "7-9", label: "Nivel 7–9", color: "#10b981" },
            { key: "10", label: "Nivel 10", color: "#3b82f6" },
            { key: "leech", label: "Difíciles", color: "#f59e0b" },
          ] as const
        ).map(({ key, label, color }) => {
          const count = levelGroups[key];
          const active = levelFilter === key;
          return (
            <button
              key={key}
              onClick={() => setLevelFilter(key)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all touch:py-2.5 ${active
                ? "text-white border-transparent"
                : "border-border text-muted-foreground hover:text-foreground"
                }`}
              style={active ? { background: color } : {}}
            >
              {label}{" "}
              <span className={active ? "opacity-80" : "opacity-50"}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 touch:h-11pl-9"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {languages.length > 1 && (
            <Select value={langFilter} onValueChange={setLangFilter}>
              <SelectTrigger className="h-10 touch:h-11w-full sm:w-32">
                <SelectValue placeholder="Idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {languages.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {sourceBooks.length > 0 && (
            <Select value={bookFilter} onValueChange={setBookFilter}>
              <SelectTrigger className="h-10 touch:h-11w-full sm:w-44">
                <SelectValue placeholder="Libro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los libros</SelectItem>
                {sourceBooks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "recent" | "due" | "alpha")}
          >
            <SelectTrigger className="h-10 touch:h-11w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Más recientes</SelectItem>
              <SelectItem value="due">Próximo repaso</SelectItem>
              <SelectItem value="alpha">Alfabético</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && words.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Aún no hay palabras. La forma natural de llenarse esto: abre un
            libro y <strong>toca cualquier palabra</strong> que no conozcas —
            se traduce y se guarda aquí sola.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link to="/lector" viewTransition>
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" /> Ir a la biblioteca
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Añadir a mano
            </Button>
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && words.length > 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <Search className="h-8 w-8 opacity-20" />
          <p className="text-sm">Ninguna palabra coincide con los filtros.</p>
        </div>
      )}

      <WordDetailSheet
        word={detailWord}
        onClose={() => setDetailWord(null)}
        onDelete={handleDeleteWord}
        onToggleIgnore={toggleIgnore}
        onSaved={(updated) => setDetailWord(updated)}
      />

      <div className="landing-rise grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <WordCard
            key={w.id}
            word={w}
            isSelected={selected.has(w.id)}
            onToggleSelect={() => toggleSel(w.id)}
            onOpenDetail={() => setDetailWord(w)}
            onToggleIgnore={() => toggleIgnore(w.id, w.status)}
            onDelete={() => handleDeleteWord(w.id)}
          />
        ))}
      </div>
    </div>
  );
}
