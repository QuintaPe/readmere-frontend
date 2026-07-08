import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { translateWord, activeAiProvider } from "@/lib/ai.functions";
import { bumpStudyToday } from "@/lib/streak";
import { toast } from "sonner";
import type { Lookup } from "@/types/reader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UseWordLookupProps {
  bookId: string | undefined;
  renditionRef: React.MutableRefObject<Any>;
  savedTermsRef: React.MutableRefObject<string[]>;
  savedWordsDataRef: React.MutableRefObject<{
    term: string;
    translation?: string;
    definition?: string;
    example?: string;
    phonetic?: string;
    partOfSpeech?: string;
    synonyms?: string;
  }[]>;
  bookLanguageRef: React.MutableRefObject<string>;
  bookmarkPhrasesRef: React.MutableRefObject<string[]>;
  bookLanguage: string | undefined;
  rehighlightAll: () => void;
}

export function useWordLookup({
  bookId,
  savedTermsRef,
  savedWordsDataRef,
  bookLanguageRef,
  bookLanguage,
  rehighlightAll,
}: UseWordLookupProps) {
  const [lookup, setLookup] = useState<Lookup | null>(null);

  async function openLookup(term: string, context: string, language: string) {
    setLookup({ term, context, loading: true });
    try {
      // translateWord nunca lanza: sirve de caché si puede y devuelve campos
      // vacíos si la IA falla. Se intenta SIEMPRE primero para que las
      // palabras ya cacheadas funcionen aunque no haya clave configurada.
      const r = await translateWord({
        data: { term, context, sourceLanguage: language, targetLanguage: "es" },
      });
      if (!r.translation && !r.definition && !activeAiProvider()) {
        // Sin clave de IA el popup salía vacío y mudo; ahora explica el porqué
        // y lleva a Ajustes.
        setLookup({ term, context, loading: false, missingAi: true });
        return;
      }
      setLookup({ term, context, ...r, loading: false });
    } catch (e) {
      setLookup({
        term,
        context,
        loading: false,
        translation: "Error",
        definition: e instanceof Error ? e.message : "",
      });
    }
  }

  // Prefer a real sentence from the book (sentence mining): the sentence in the
  // surrounding context that actually contains the term. Fall back to the AI example.
  function bookSentence(context: string | undefined, term: string): string | null {
    if (!context) return null;
    const sentences = context.split(/(?<=[.!?。！？])\s+/);
    const hit = sentences.find((s) =>
      s.toLowerCase().includes(term.toLowerCase()),
    );
    const s = (hit ?? context).trim();
    return s.length >= 3 && s.length <= 300 ? s : null;
  }

  async function saveWord() {
    if (!lookup) return;
    try {
      await fetchApi("/words", {
        method: "POST",
        body: JSON.stringify({
          term: lookup.term,
          translation: lookup.translation,
          definition: lookup.definition,
          example:
            bookSentence(lookup.context, lookup.term) ||
            lookup.example ||
            lookup.context,
          language: bookLanguage || "en",
          source: "reader",
          sourceBookId: bookId,
          phonetic: lookup.phonetic || null,
          partOfSpeech: lookup.partOfSpeech || null,
          synonyms: lookup.synonyms || null,
          lemma: (lookup as Any).lemma || null,
          difficulty: (lookup as Any).difficulty || null,
        }),
      });
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
    await bumpStudyToday({ wordsAdded: 1 });
    toast.success("Guardada en vocabulario");
    if (!savedTermsRef.current.includes(lookup.term)) {
      savedTermsRef.current = [...savedTermsRef.current, lookup.term];
      rehighlightAll();
    }
    setLookup(null);
  }

  return {
    lookup,
    setLookup,
    openLookup,
    saveWord,
    savedWordsDataRef,
    bookLanguageRef,
  };
}
