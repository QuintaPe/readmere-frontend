import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Layers, Brain } from "lucide-react";
import NewDeckDialog from "./components/NewDeckDialog";
import { useDecks } from "./hooks/useDecks";

const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

export default function DecksPage() {
  const { decks, loading, remove, invalidate } = useDecks();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl" style={display}>
            Mis mazos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {decks.length} {decks.length === 1 ? "mazo" : "mazos"} · agrupa tu vocabulario para repasarlo
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nuevo mazo
            </Button>
          </DialogTrigger>
          <NewDeckDialog
            onDone={() => {
              setOpen(false);
              invalidate();
            }}
          />
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[172px] w-full rounded-xl" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="card-elevated flex flex-col items-center rounded-2xl p-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
            <Layers className="h-7 w-7 text-primary" />
          </div>
          <h2 className="mt-5 font-serif text-2xl font-medium tracking-tight" style={display}>
            Sin mazos todavía
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Crea tu primer mazo para organizar tu vocabulario por temas o libros y repasarlo con flashcards.
          </p>
          <Button className="mt-6 gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Crear mi primer mazo
          </Button>
        </div>
      ) : (
        <div className="landing-rise grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {decks.map((d) => {
            const count = d.wordCount ?? 0;
            return (
              <div
                key={d.id}
                className="card-elevated group flex flex-col rounded-xl p-5 transition-colors hover:border-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white/90 shadow-sm"
                    style={{ background: d.color }}
                  >
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="truncate font-semibold">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} palabras
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(d.id)}
                    className="opacity-0 transition-opacity group-hover:opacity-100 touch:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {d.description && (
                  <div className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {d.description}
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/mazos/${d.id}`} viewTransition className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Ver
                    </Button>
                  </Link>
                  <Link to={`/flashcards?deck=${d.id}`} viewTransition>
                    <Button size="sm" className="gap-1">
                      <Brain className="h-3.5 w-3.5" /> Repasar
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
