import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Sparkles, BookOpen } from "lucide-react";

const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

interface SessionCompleteProps {
  cramMode: boolean;
  sessionDone: number;
  sessionAgain: number;
  sessionLevelUps: number;
  hasCards: boolean;
  deckId: string | null;
  onRefetch: () => void;
  onCram: () => void;
}

export default function SessionComplete({
  cramMode,
  sessionDone,
  sessionAgain,
  sessionLevelUps,
  hasCards,
  deckId,
  onRefetch,
  onCram,
}: SessionCompleteProps) {
  // Sin una sola tarjeta y sin sesión hecha no hay nada que celebrar: guiar
  // al lector en vez de mostrar un trofeo engañoso de "Todo al día".
  if (!hasCards && sessionDone === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <BookOpen className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight md:text-4xl" style={display}>
          Aún no hay tarjetas
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {deckId
            ? "Este mazo está vacío. Añádele palabras desde tu vocabulario."
            : "Las flashcards se crean solas: abre un libro y toca las palabras que no conozcas."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {deckId ? (
            <Link to="/vocabulario" viewTransition>
              <Button className="gap-2">Ir al vocabulario</Button>
            </Link>
          ) : (
            <Link to="/lector" viewTransition>
              <Button className="gap-2">
                <BookOpen className="h-4 w-4" /> Ir a la biblioteca
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center px-6 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Trophy className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight md:text-4xl" style={display}>
        {cramMode ? "Sesión libre completada" : "Todo al día"}
      </h1>
      {sessionDone > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-2xl font-bold text-foreground">
              {sessionDone}
            </span>
            <span className="text-muted-foreground">repasadas</span>
          </div>
          {sessionAgain > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-destructive">
                {sessionAgain}
              </span>
              <span className="text-muted-foreground">falladas</span>
            </div>
          )}
          {sessionLevelUps > 0 && (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-primary">
                {sessionLevelUps}
              </span>
              <span className="text-muted-foreground">subieron de nivel</span>
            </div>
          )}
        </div>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {hasCards && (
          <Button onClick={onRefetch} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Repasar de nuevo
          </Button>
        )}
        {hasCards && (
          <Button variant="secondary" onClick={onCram} className="gap-2">
            <Sparkles className="h-4 w-4" /> Modo libre
          </Button>
        )}
        <Link to="/vocabulario" viewTransition>
          <Button variant="outline">Ver vocabulario</Button>
        </Link>
        {deckId && (
          <Link to="/flashcards" viewTransition>
            <Button variant="outline">Repasar todo</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
