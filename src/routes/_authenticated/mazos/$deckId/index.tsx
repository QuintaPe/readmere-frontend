import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Brain, Search, Trash2, Plus } from "lucide-react";
import AddWordsDialog from "./components/AddWordsDialog";
import { useDeckDetail } from "./hooks/useDeckDetail";

export default function DeckDetail() {
  const { deckId } = useParams();
  const { user, deck, words, removeWord, invalidateWords } =
    useDeckDetail(deckId);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = words.filter(
    (w) => !q || w.term.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-6 py-8">
      <Link to="/mazos" viewTransition>
        <Button variant="ghost" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Mazos
        </Button>
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {deck && (
            <div
              className="h-12 w-12 rounded-lg"
              style={{ background: deck.color }}
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{deck?.name ?? "Mazo"}</h1>
            <p className="text-muted-foreground">
              {words.length} palabras
              {deck?.description ? ` · ${deck.description}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> Añadir
              </Button>
            </DialogTrigger>
            <AddWordsDialog
              userId={user.id}
              deckId={deckId!}
              existingIds={new Set(words.map((w) => w.id))}
              onDone={() => {
                setAddOpen(false);
                invalidateWords();
              }}
            />
          </Dialog>
          <Link to={`/flashcards?deck=${deckId}`} viewTransition>
            <Button className="gap-2">
              <Brain className="h-4 w-4" /> Repasar mazo
            </Button>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="card-elevated overflow-hidden rounded-xl">
        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No hay palabras en este mazo.
          </div>
        )}
        {filtered.map((w) => (
          <div
            key={w.id}
            className="grid grid-cols-[1fr_1fr_120px_44px] items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0"
          >
            <div className="font-medium">{w.term}</div>
            <div className="text-sm text-muted-foreground">{w.translation}</div>
            <Badge variant="outline" className="justify-center">
              {w.status}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeWord(w.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
