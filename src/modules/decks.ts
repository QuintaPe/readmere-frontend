import { fetchApi } from "@/lib/api";
import type { Deck, Word } from "@/types";

export function listDecks(): Promise<Deck[]> {
  return fetchApi("/decks");
}

export function createDeck(data: {
  name: string;
  description?: string | null;
  color: string;
}): Promise<Deck> {
  return fetchApi("/decks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteDeck(id: string): Promise<void> {
  return fetchApi(`/decks/${id}`, { method: "DELETE" });
}

export function listDeckWords(deckId: string): Promise<{ word: Word }[]> {
  return fetchApi(`/decks/${deckId}/words`);
}

export function addWordToDeck(deckId: string, wordId: string): Promise<void> {
  return fetchApi(`/decks/${deckId}/words`, {
    method: "POST",
    body: JSON.stringify({ wordId }),
  });
}

export function removeWordFromDeck(deckId: string, wordId: string): Promise<void> {
  return fetchApi(`/decks/${deckId}/words/${wordId}`, { method: "DELETE" });
}
