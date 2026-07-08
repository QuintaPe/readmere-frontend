import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Check } from "lucide-react";

interface Cover {
  url: string;
  source: string;
}

interface CoverPickerDialogProps {
  open: boolean;
  title: string;
  author?: string | null;
  covers: Cover[];
  loading: boolean;
  onSelect: (url: string | null) => void;
}

export function CoverPickerDialog({
  open,
  title,
  author,
  covers,
  loading,
  onSelect,
}: CoverPickerDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleConfirm() {
    onSelect(selected);
    setSelected(null);
  }

  function handleSkip() {
    onSelect(null);
    setSelected(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleSkip();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Elige una portada</DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">{title}</span>
            {author && <span> · {author}</span>}
          </p>
        </DialogHeader>

        {loading ? (
          <div className="grid grid-cols-4 gap-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        ) : covers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10" />
            <p className="text-sm">
              No se encontraron portadas para este libro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3 py-4">
            {covers.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelected(c.url === selected ? null : c.url)}
                className={`relative aspect-[2/3] overflow-hidden rounded-lg border-2 transition-all ${
                  selected === c.url
                    ? "border-primary shadow-lg scale-105"
                    : "border-transparent hover:border-muted-foreground/40"
                }`}
              >
                <img
                  src={c.url}
                  alt={`Portada ${i + 1}`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (
                      e.currentTarget.parentElement as HTMLElement
                    ).style.display = "none";
                  }}
                />
                {selected === c.url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Sin portada
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected && covers.length > 0}
          >
            {selected ? "Usar esta portada" : "Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export async function searchBookCovers(
  title: string,
  author?: string | null,
): Promise<Cover[]> {
  const covers: Cover[] = [];

  try {
    const query = [title, author].filter(Boolean).join(" ");
    const encoded = encodeURIComponent(query);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encoded}&limit=8&fields=cover_i,title,author_name`,
    );
    if (res.ok) {
      const data = await res.json();
      const seen = new Set<number>();
      for (const doc of data.docs ?? []) {
        if (doc.cover_i && !seen.has(doc.cover_i)) {
          seen.add(doc.cover_i);
          covers.push({
            url: `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
            source: "openlibrary",
          });
          if (covers.length >= 6) break;
        }
      }
    }
  } catch (e) {
    console.warn("Cover search failed", e);
  }

  // Fallback: Google Books
  if (covers.length < 3) {
    try {
      const q = encodeURIComponent(
        `intitle:${title}${author ? `+inauthor:${author}` : ""}`,
      );
      const res = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=6&printType=books`,
      );
      if (res.ok) {
        const data = await res.json();
        for (const item of data.items ?? []) {
          const thumb = item.volumeInfo?.imageLinks?.thumbnail;
          if (thumb) {
            const url = thumb
              .replace("http://", "https://")
              .replace("&zoom=1", "&zoom=3");
            if (!covers.some((c) => c.url === url)) {
              covers.push({ url, source: "google" });
              if (covers.length >= 6) break;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Google Books cover search failed", e);
    }
  }

  return covers;
}
