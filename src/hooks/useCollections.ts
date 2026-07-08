import { useAuth } from "@/auth/auth-context";
import { listBooks } from "@/modules/books";
import { listWords } from "@/modules/words";
import { listDecks } from "@/modules/decks";
import { useQuery, invalidateQuery } from "@/lib/query";
import type { Book, Word } from "@/types";

type DeckList = Awaited<ReturnType<typeof listDecks>>;

export function useBooks() {
  const { user } = useAuth();
  const { data, loading, refetch } = useQuery<Book[]>(`books:${user.id}`, listBooks);
  return { books: data ?? [], loading, refetch };
}

export function useWords() {
  const { user } = useAuth();
  const { data, loading, refetch } = useQuery<Word[]>(`words:${user.id}`, listWords);
  return { words: data ?? [], loading, refetch };
}

export function useDeckList() {
  const { user } = useAuth();
  const { data, loading, refetch } = useQuery<DeckList>(`decks:${user.id}`, listDecks);
  return { decks: data ?? [], loading, refetch };
}

/** Refetch cached lists after a mutation. */
export const invalidateBooks = () => invalidateQuery("books");
export const invalidateWords = () => invalidateQuery("words");
export const invalidateDecks = () => invalidateQuery("decks");
