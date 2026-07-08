import { useAuth } from "@/auth/auth-context";
import { useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { uploadBook, deleteBook } from "@/modules/books";
import { useBooks, invalidateBooks } from "@/hooks/useCollections";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";
import { uploadEpubToStorage, deleteEpubFromStorage } from "@/lib/supabase";
import { deleteEpubFromCache } from "./$bookId/lib/epub-cache";
import { addDemoBook, findDemoBook } from "@/lib/demo-book";
import { activeAiProvider } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import {
  CoverPickerDialog,
  searchBookCovers,
} from "@/components/CoverPickerDialog";
import { fetchBookMetadata } from "@/lib/ai.functions";
import BookCard from "./components/BookCard";
import BookDetailSheet from "./components/BookDetailSheet";
import type { Book } from "@/types";

const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

interface Cover {
  url: string;
  source: string;
}

interface PendingUpload {
  file: File;
  title: string;
  author: string | null;
}

export default function Library() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState<PendingUpload | null>(null);
  const [covers, setCovers] = useState<Cover[]>([]);
  const [searchingCovers, setSearchingCovers] = useState(false);
  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [q, setQ] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "recent" | "alpha" | "progress" | "year"
  >("recent");

  const { books, loading } = useBooks();

  // Borrado con deshacer: el libro desaparece al instante y el DELETE real
  // (fila + copia local + archivo en Storage) se difiere 5s.
  const { pendingDelete, queueDelete } = useUndoableDelete({
    onDelete: async (id) => {
      // Capturar filePath antes de borrar la fila: luego ya no hay de dónde.
      const filePath = books.find((b) => b.id === id)?.filePath;
      await deleteBook(id);
      // Limpieza best-effort del EPUB: copia local y archivo en Storage
      // (antes ambos quedaban huérfanos para siempre).
      void deleteEpubFromCache(id);
      if (filePath) deleteEpubFromStorage(filePath).catch(() => {});
    },
    onDeleted: invalidateBooks,
    label: "Libro eliminado",
  });

  const genres = useMemo(
    () =>
      [
        ...new Set<string>(books.map((b) => b.genre ?? "").filter(Boolean)),
      ].sort(),
    [books],
  );

  const filtered = useMemo(() => {
    let list = books.filter((b) => !pendingDelete.has(b.id));
    if (q) {
      const lq = q.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(lq) ||
          (b.author ?? "").toLowerCase().includes(lq),
      );
    }
    if (genreFilter !== "all")
      list = list.filter((b) => b.genre === genreFilter);
    if (sortBy === "recent")
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    if (sortBy === "alpha") list.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === "progress")
      list.sort((a, b) => (b.progress || 0) - (a.progress || 0));
    if (sortBy === "year")
      list.sort((a, b) => (b.publishedYear || 0) - (a.publishedYear || 0));
    return list;
  }, [books, q, genreFilter, sortBy, pendingDelete]);

  async function handleUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".epub"))
      return toast.error("Solo archivos EPUB");
    if (file.size > 50 * 1024 * 1024) return toast.error("Máximo 50MB");

    let title = file.name.replace(/\.epub$/i, "");
    let author: string | null = null;
    try {
      const ePubModule = await import("epubjs");
      const ePub = (ePubModule as { default: (input: ArrayBuffer) => unknown })
        .default;
      const buf = await file.arrayBuffer();
      const book = ePub(buf) as {
        loaded: { metadata: Promise<{ title?: string; creator?: string }> };
      };
      const meta = await book.loaded.metadata;
      if (meta.title) title = meta.title;
      if (meta.creator) author = meta.creator;
    } catch (e) {
      console.warn("epub meta failed", e);
    }

    setPending({ file, title, author });
    setSearchingCovers(true);
    setCovers([]);

    const found = await searchBookCovers(title, author);
    setCovers(found);
    setSearchingCovers(false);
  }

  async function handleCoverSelected(coverUrl: string | null) {
    if (!pending) return;
    const { file, title, author } = pending;
    setPending(null);

    setUploading(true);
    try {
      const [metadata, filePath] = await Promise.all([
        fetchBookMetadata({ title, author }),
        uploadEpubToStorage(file, user.id),
      ]);

      await uploadBook({
        filePath,
        title,
        author,
        coverPath: coverUrl,
        synopsis: metadata?.synopsis,
        genre: metadata?.genre,
        publishedYear: metadata?.publishedYear,
      });
      toast.success("Libro añadido");
      invalidateBooks();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  const navigate = useNavigate();
  const [addingDemo, setAddingDemo] = useState(false);

  // Onboarding: un clásico de dominio público listo en un clic, para poder
  // probar el lector sin tener un EPUB a mano.
  async function tryDemoBook() {
    const existing = findDemoBook(books);
    if (existing)
      return navigate(`/lector/${existing.id}`, {
        viewTransition: true,
        state: { coverPath: existing.coverPath, title: existing.title },
      });
    setAddingDemo(true);
    try {
      const created = await addDemoBook();
      invalidateBooks();
      navigate(`/lector/${created.id}`, {
        viewTransition: true,
        state: { coverPath: created.coverPath, title: created.title },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al añadir el libro");
    } finally {
      setAddingDemo(false);
    }
  }

  function removeBook(id: string) {
    if (!queueDelete(id)) return;
    if (detailBook?.id === id) setDetailBook(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl" style={display}>
            Biblioteca
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {books.length > 0
              ? `${books.length} ${books.length === 1 ? "libro" : "libros"} · toca cualquier palabra para traducirla mientras lees`
              : "Sube tus EPUB y léelos con traducción al instante."}
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".epub,application/epub+zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
        <Button
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />{" "}
          {uploading ? "Subiendo..." : "Subir EPUB"}
        </Button>
      </div>

      {books.length > 0 && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-10 touch:h-11pl-9"
              placeholder="Buscar por título o autor..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {genres.length > 0 && (
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="h-10 touch:h-11w-full sm:w-40">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los géneros</SelectItem>
                  {genres.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={sortBy}
              onValueChange={(v) =>
                setSortBy(v as "recent" | "alpha" | "progress" | "year")
              }
            >
              <SelectTrigger className="h-10 touch:h-11w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="alpha">Alfabético</SelectItem>
                <SelectItem value="progress">Por progreso</SelectItem>
                <SelectItem value="year">Por año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <CoverPickerDialog
        open={!!pending}
        title={pending?.title ?? ""}
        author={pending?.author}
        covers={covers}
        loading={searchingCovers}
        onSelect={handleCoverSelected}
      />

      <BookDetailSheet
        book={detailBook}
        onClose={() => setDetailBook(null)}
        onRemove={removeBook}
        onSaved={(updated) => setDetailBook(updated)}
      />

      {loading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="card-elevated mt-12 flex flex-col items-center rounded-2xl p-10 text-center sm:p-16">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
            <BookOpen className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-5 font-serif text-2xl font-medium tracking-tight" style={display}>
            Así funciona Readmere
          </h2>

          <ol className="mt-6 grid max-w-lg gap-4 text-left sm:grid-cols-3">
            {[
              { n: 1, text: "Sube un EPUB (o abre el libro de ejemplo)" },
              { n: 2, text: "Toca cualquier palabra mientras lees para traducirla y guardarla" },
              { n: 3, text: "Repásala con flashcards justo cuando la ibas a olvidar" },
            ].map((s) => (
              <li key={s.n} className="flex gap-3 sm:flex-col sm:items-center sm:text-center">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {s.n}
                </span>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <Button
              disabled={uploading || addingDemo}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Subir mi primer libro"}
            </Button>
            <Button
              variant="secondary"
              disabled={uploading || addingDemo}
              onClick={tryDemoBook}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {addingDemo ? "Preparando..." : "Probar con Alicia en el País de las Maravillas"}
            </Button>
          </div>

          {!activeAiProvider() && (
            <p className="mt-6 max-w-sm text-xs leading-relaxed text-muted-foreground">
              💡 Las traducciones al tocar una palabra usan una clave de IA
              gratuita (Groq o Gemini).{" "}
              <Link to="/ajustes" className="font-medium text-primary hover:underline">
                Configúrala en Ajustes
              </Link>{" "}
              en un minuto.
            </p>
          )}
        </div>
      ) : (
        <div className="landing-rise mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Search className="h-8 w-8 opacity-20" />
              <p className="text-sm">
                No hay libros que coincidan con tu búsqueda.
              </p>
            </div>
          ) : null}
          {filtered.map((b) => (
            <BookCard
              key={b.id}
              book={b}
              onOpenDetail={() => setDetailBook(b)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
