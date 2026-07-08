import { useState } from "react";
import { Link } from "react-router-dom";
import { updateBook } from "@/modules/books";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  BookOpen,
  Clock,
  Tag,
  Calendar,
  Pencil,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Book } from "@/types";

function readingTimeLabel(progress: number): string | null {
  if (progress <= 0) return null;
  if (progress >= 1) return "Terminado";
  const remainingMinutes = Math.round((1 - progress) * 8 * 60);
  if (remainingMinutes < 60) return `~${remainingMinutes} min`;
  const h = Math.floor(remainingMinutes / 60);
  const m = remainingMinutes % 60;
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`;
}

type BookDraft = Partial<
  Pick<
    Book,
    "title" | "author" | "genre" | "publishedYear" | "synopsis" | "coverPath"
  >
>;

interface BookDetailSheetProps {
  book: Book | null;
  onClose: () => void;
  onRemove: (id: string) => void;
  onSaved: (updated: Book) => void;
}

export default function BookDetailSheet({
  book: detailBook,
  onClose,
  onRemove,
  onSaved,
}: BookDetailSheetProps) {
  const [editingBook, setEditingBook] = useState(false);
  const [bookDraft, setBookDraft] = useState<BookDraft>({});

  async function saveBookEdit() {
    if (!detailBook) return;
    try {
      await updateBook(detailBook.id, bookDraft);
      const updated = { ...detailBook, ...bookDraft };
      setEditingBook(false);
      onSaved(updated);
      toast.success("Guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  function startEdit() {
    setEditingBook(true);
    setBookDraft({
      title: detailBook?.title ?? "",
      author: detailBook?.author ?? "",
      genre: detailBook?.genre ?? "",
      publishedYear: detailBook?.publishedYear ?? undefined,
      synopsis: detailBook?.synopsis ?? "",
      coverPath: detailBook?.coverPath ?? "",
    });
  }

  return (
    <Sheet
      open={!!detailBook}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setEditingBook(false);
        }
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {detailBook && (
          <>
            <div className="flex items-start justify-between gap-3 p-6 pb-4">
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-2xl font-bold leading-tight">
                  {detailBook.title}
                </SheetTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailBook.author || "Autor desconocido"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {detailBook.genre && (
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Tag className="h-3 w-3" /> {detailBook.genre}
                    </span>
                  )}
                  {detailBook.publishedYear && (
                    <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      <Calendar className="h-3 w-3" />{" "}
                      {detailBook.publishedYear}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={startEdit}
                className="shrink-0 rounded-full bg-muted p-2.5 text-muted-foreground transition-opacity hover:opacity-70"
                title="Editar"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="h-px bg-border mx-6" />

            {editingBook ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {(
                  [
                    { label: "Título", key: "title", multiline: false },
                    { label: "Autor", key: "author", multiline: false },
                    { label: "Género", key: "genre", multiline: false },
                    {
                      label: "Año de publicación",
                      key: "publishedYear",
                      multiline: false,
                    },
                    {
                      label: "URL de portada",
                      key: "coverPath",
                      multiline: false,
                    },
                    { label: "Sinopsis", key: "synopsis", multiline: true },
                  ] as {
                    label: string;
                    key: keyof BookDraft;
                    multiline: boolean;
                  }[]
                ).map(({ label, key, multiline }) => (
                  <div key={key}>
                    <Label className="text-xs text-muted-foreground">
                      {label}
                    </Label>
                    {multiline ? (
                      <Textarea
                        className="mt-1"
                        rows={3}
                        value={String(bookDraft[key] ?? "")}
                        onChange={(e) =>
                          setBookDraft((d) => ({
                            ...d,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    ) : (
                      <Input
                        className="mt-1"
                        value={String(bookDraft[key] ?? "")}
                        onChange={(e) =>
                          setBookDraft((d) => ({
                            ...d,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="flex justify-center">
                  <div className="w-36 overflow-hidden rounded-xl shadow-lg">
                    {detailBook.coverPath ? (
                      <img
                        src={detailBook.coverPath}
                        alt={detailBook.title}
                        className="w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[2/3] w-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <BookOpen className="h-10 w-10 text-primary/60" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Progreso</span>
                    <div className="flex items-center gap-2">
                      {readingTimeLabel(detailBook.progress || 0) && (
                        <span className="flex items-center gap-1 text-muted-foreground/60">
                          <Clock className="h-3 w-3" />
                          {readingTimeLabel(detailBook.progress || 0)}
                        </span>
                      )}
                      <span>
                        {Math.round((detailBook.progress || 0) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.round((detailBook.progress || 0) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {detailBook.synopsis && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sinopsis
                    </p>
                    <p className="text-sm leading-relaxed text-foreground">
                      {detailBook.synopsis}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 border-t p-6">
              {editingBook ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditingBook(false)}
                  >
                    Cancelar
                  </Button>
                  <Button className="flex-1 gap-2" onClick={saveBookEdit}>
                    <Check className="h-4 w-4" /> Guardar
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to={`/lector/${detailBook.id}`}
                    viewTransition
                    state={{ coverPath: detailBook.coverPath, title: detailBook.title }}
                    className="flex-1"
                  >
                    <Button className="w-full">Leer ahora</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onRemove(detailBook.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
