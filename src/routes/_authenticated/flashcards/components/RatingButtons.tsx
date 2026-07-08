import { RotateCcw } from "lucide-react";
import type { SrsRating } from "@/lib/srs";
import type { Word } from "@/types";

interface RatingButtonsProps {
  card: Word;
  onRate: (rating: SrsRating) => void;
}

export default function RatingButtons({ card, onRate }: RatingButtonsProps) {
  return (
    <div className="mt-6 space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          onClick={() => onRate(0)}
          className="flex flex-col items-center gap-1 rounded-xl border-2 touch:py-4 border-destructive/40 bg-destructive/10 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
        >
          <RotateCcw className="h-4 w-4" />
          De nuevo
          <span className="text-[10px] opacity-60">10 min</span>
        </button>
        <button
          onClick={() => onRate(1)}
          className="flex flex-col items-center gap-1 rounded-xl border-2 touch:py-4 border-orange-500/30 bg-orange-500/10 py-3 text-sm font-medium text-orange-400 transition-colors hover:bg-orange-500/20"
        >
          Difícil
          <span className="text-[10px] opacity-60">
            &lt; {Math.max(1, Math.round((card.srsInterval || 1) * 1.2))}d
          </span>
        </button>
        <button
          onClick={() => onRate(2)}
          className="flex flex-col items-center gap-1 rounded-xl border-2 touch:py-4 border-primary/40 bg-primary/10 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          Bien
          <span className="text-[10px] opacity-60">
            ~
            {card.srsReps === 0
              ? 1
              : Math.round((card.srsInterval || 1) * (card.srsEase || 2.5))}
            d
          </span>
        </button>
        <button
          onClick={() => onRate(3)}
          className="flex flex-col items-center gap-1 rounded-xl border-2 touch:py-4 border-blue-500/30 bg-blue-500/10 py-3 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
        >
          Fácil
          <span className="text-[10px] opacity-60">
            ~
            {card.srsReps === 0
              ? 3
              : Math.round(
                  (card.srsInterval || 1) * (card.srsEase || 2.5) * 1.3,
                )}
            d
          </span>
        </button>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Teclas:{" "}
        <kbd className="rounded border border-border bg-muted px-1">1</kbd> ·{" "}
        <kbd className="rounded border border-border bg-muted px-1">2</kbd> ·{" "}
        <kbd className="rounded border border-border bg-muted px-1">3</kbd> ·{" "}
        <kbd className="rounded border border-border bg-muted px-1">4</kbd>
      </p>
    </div>
  );
}
