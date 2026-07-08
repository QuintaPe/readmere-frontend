import { fetchApi } from "@/lib/api";
import type { Word } from "@/types";

export function listWords(): Promise<Word[]> {
  return fetchApi("/words");
}

// Server-side session pool: due reviews + up to `newLimit` new cards. Uses the
// (user_id, srs_due) index instead of downloading the whole vocabulary.
export function listWordsDue(newLimit = 0): Promise<Word[]> {
  return fetchApi(`/words/due?newLimit=${newLimit}`);
}

export function createWord(data: {
  term: string;
  translation?: string | null;
  definition?: string | null;
  example?: string | null;
  language: string;
  source?: string | null;
  lemma?: string | null;
  difficulty?: string | null;
}): Promise<Word> {
  return fetchApi("/words", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateWord(
  id: string,
  data: Partial<
    Pick<
      Word,
      | "translation"
      | "definition"
      | "example"
      | "phonetic"
      | "partOfSpeech"
      | "synonyms"
      | "lemma"
      | "difficulty"
      | "status"
      | "srsInterval"
      | "srsEase"
      | "srsReps"
      | "srsLapses"
      | "srsDue"
      | "lastReviewedAt"
    >
  >,
): Promise<Word> {
  return fetchApi(`/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteWord(id: string): Promise<void> {
  return fetchApi(`/words/${id}`, { method: "DELETE" });
}

// Importación (CSV): una sola request para todas las filas en vez de una por
// palabra. El servidor salta duplicados (userId+language+term) sin fallar.
export function createWordsBatch(
  wordsToImport: {
    term: string;
    translation?: string | null;
    definition?: string | null;
    example?: string | null;
    language?: string;
  }[],
): Promise<{ success: boolean; imported: number }> {
  return fetchApi("/words/batch", {
    method: "POST",
    body: JSON.stringify({ words: wordsToImport }),
  });
}
