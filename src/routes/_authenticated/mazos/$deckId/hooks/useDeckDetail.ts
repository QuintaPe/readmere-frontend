import { useState, useEffect } from "react";
import { useAuth } from "@/auth/auth-context";
import { listDecks, listDeckWords, removeWordFromDeck } from "@/modules/decks";
import { toast } from "sonner";

interface DeckWord {
  id: string;
  term: string;
  translation: string | null;
  status: string;
  srsDue: string;
}

export function useDeckDetail(deckId: string | undefined) {
  const { user } = useAuth();
  const [deck, setDeck] = useState<Awaited<ReturnType<typeof listDecks>>[number] | undefined>();
  const [words, setWords] = useState<DeckWord[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!deckId) return;
    listDecks()
      .then((data) => setDeck(data.find((d) => d.id === deckId)))
      .catch(() => {});
  }, [deckId, version]);

  useEffect(() => {
    if (!deckId) return;
    listDeckWords(deckId)
      .then((data) =>
        setWords(data.map((r) => r.word).filter(Boolean) as DeckWord[]),
      )
      .catch(() => {});
  }, [deckId, version]);

  async function removeWord(wordId: string) {
    try {
      await removeWordFromDeck(deckId!, wordId);
      setVersion((v) => v + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    }
  }

  function invalidateWords() {
    setVersion((v) => v + 1);
  }

  return { user, deck, words, removeWord, invalidateWords };
}
