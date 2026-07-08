import { Link, useViewTransitionState } from "react-router-dom";
import { BookOpen, Info, BookMarked } from "lucide-react";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
  onOpenDetail: () => void;
}

export default function BookCard({ book: b, onOpenDetail }: BookCardProps) {
  const pct = Math.round((b.progress || 0) * 100);
  const done = pct >= 100;

  // Shared-element transition: solo mientras esta tarjeta es la que navega,
  // su portada recibe un `view-transition-name` que casa con el del lector,
  // de modo que la miniatura "vuela" y se expande al abrir el libro.
  const to = `/lector/${b.id}`;
  const isTransitioning = useViewTransitionState(to);
  const coverName = isTransitioning ? `book-cover-${b.id}` : undefined;

  return (
    <div className="group relative overflow-hidden rounded-xl shadow-md transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] aspect-[2/3]">
      {/* Cover */}
      {b.coverPath ? (
        <img
          src={b.coverPath}
          alt={b.title}
          style={{ viewTransitionName: coverName }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div
          style={{ viewTransitionName: coverName }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/30 via-primary/10 to-background px-4 text-center"
        >
          <BookOpen className="h-10 w-10 text-primary/50" />
          <p className="text-xs font-semibold leading-tight text-foreground/70 line-clamp-3">
            {b.title}
          </p>
        </div>
      )}

      {/* Always-visible bottom gradient with title */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-2 px-3">
        {/* Progress bar */}
        {pct > 0 && (
          <div className="mb-2 h-0.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <p className="text-[11px] font-bold leading-tight text-white line-clamp-2">
          {b.title}
        </p>
        <p className="mt-0.5 text-[10px] text-white/60 truncate">
          {b.author || "Sin autor"}
        </p>
      </div>

      {/* Genre badge top-left */}
      {b.genre && (
        <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {b.genre}
        </span>
      )}

      {/* Finished badge */}
      {done && (
        <span className="absolute top-2 right-2 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-semibold text-primary-foreground backdrop-blur-sm">
          ✓ Leído
        </span>
      )}

      {/* Overlay de acciones: aparece con hover en ratón; en táctil (iPad/móvil)
          se muestra siempre como degradado inferior —sin él, abrir el libro o
          ver detalles era imposible con el dedo— dejando ver la portada. */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 touch:opacity-100 touch:justify-end touch:gap-1.5 touch:bg-gradient-to-t touch:from-black/85 touch:via-black/40 touch:to-transparent touch:pb-3 touch:backdrop-blur-0">
        <Link
          to={to}
          viewTransition
          state={{ coverPath: b.coverPath, title: b.title }}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-opacity hover:opacity-90"
        >
          <BookMarked className="h-4 w-4" />
          {pct > 0 ? "Continuar" : "Leer"}
        </Link>
        <button
          onClick={onOpenDetail}
          className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/25"
        >
          <Info className="h-3.5 w-3.5" />
          Detalles
        </button>
      </div>
    </div>
  );
}
