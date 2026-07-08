import { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { listWords } from "@/modules/words";
import { addWordToDeck } from "@/modules/decks";
import { toast } from "sonner";
import type { Word } from "@/types";

interface AddWordsDialogProps {
  userId: string;
  deckId: string;
  existingIds: Set<string>;
  onDone: () => void;
}

export default function AddWordsDialog({
  userId,
  deckId,
  existingIds,
  onDone,
}: AddWordsDialogProps) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [words, setWords] = useState<Word[]>([]);

  useEffect(() => {
    listWords()
      .then((data) => setWords(data.sort((a, b) => a.term.localeCompare(b.term))))
      .catch(() => {});
  }, [userId]);

  const available = words.filter(
    (w) =>
      !existingIds.has(w.id) &&
      (!q || w.term.toLowerCase().includes(q.toLowerCase())),
  );

  async function save() {
    if (picked.size === 0) return onDone();
    let successCount = 0;
    for (const wid of Array.from(picked)) {
      try {
        await addWordToDeck(deckId, wid);
        successCount++;
      } catch {
        /* skip */
      }
    }
    toast.success(`${successCount} añadidas`);
    onDone();
  }

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Añadir palabras al mazo</DialogTitle>
      </DialogHeader>
      <Input
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="max-h-80 overflow-y-auto rounded-md border border-border">
        {available.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Sin palabras disponibles
          </div>
        ) : (
          available.map((w) => (
            <label
              key={w.id}
              className="flex cursor-pointer items-center gap-3 border-b border-border/50 px-3 py-2 last:border-0 hover:bg-accent/50"
            >
              <Checkbox
                checked={picked.has(w.id)}
                onCheckedChange={(c) => {
                  setPicked((s) => {
                    const ns = new Set(s);
                    if (c) ns.add(w.id);
                    else ns.delete(w.id);
                    return ns;
                  });
                }}
              />
              <div className="flex-1 overflow-hidden">
                <div className="truncate font-medium">{w.term}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {w.translation}
                </div>
              </div>
            </label>
          ))
        )}
      </div>
      <DialogFooter>
        <Button onClick={save}>
          Añadir {picked.size > 0 ? `(${picked.size})` : ""}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
