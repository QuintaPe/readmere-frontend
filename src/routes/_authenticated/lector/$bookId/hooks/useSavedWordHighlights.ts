import { useEffect, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { highlightInDoc } from "../lib/epub-highlight";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

export type SavedWordData = {
  term: string;
  translation?: string;
  definition?: string;
  example?: string;
  phonetic?: string;
  partOfSpeech?: string;
  synonyms?: string;
  status?: string;
};

interface UseSavedWordHighlightsProps {
  renditionRef: React.MutableRefObject<Any>;
  bookMeta: { language: string } | null;
}

/**
 * Vocabulario guardado del idioma del libro y sus resaltados en el texto.
 * Los documentos de capítulo viven en iframes de epub.js, fuera del ciclo de
 * React: por eso el vocabulario se mantiene en refs que se leen al (re)pintar.
 */
export function useSavedWordHighlights({
  renditionRef,
  bookMeta,
}: UseSavedWordHighlightsProps) {
  const savedTermsRef = useRef<string[]>([]);
  const savedWordsDataRef = useRef<SavedWordData[]>([]);
  // Lowercased term → SRS status, used to colour highlights (known vs learning).
  const savedStatusRef = useRef<Map<string, string>>(new Map());

  // Colour a highlight by SRS status: mastered words get a calmer green,
  // everything still-being-learned keeps the default blue.
  function classForTerm(term: string) {
    return savedStatusRef.current.get(term.toLowerCase()) === "known"
      ? "lc-saved lc-known"
      : "lc-saved";
  }

  /** Resalta las palabras guardadas en un documento de capítulo recién pintado. */
  function highlightSavedInDoc(doc: Document) {
    highlightInDoc(doc, savedTermsRef.current, classForTerm);
  }

  /** Quita y vuelve a aplicar los resaltados en todos los capítulos visibles. */
  function rehighlightAll() {
    const r = renditionRef.current;
    if (!r) return;
    try {
      const views = r.manager?.views?._views || [];
      for (const v of views) {
        const doc: Document | undefined = v?.document || v?.contents?.document;
        if (doc) {
          doc.querySelectorAll("mark.lc-saved").forEach((m) => {
            const t = doc.createTextNode(m.textContent || "");
            m.parentNode?.replaceChild(t, m);
          });
          highlightInDoc(doc, savedTermsRef.current, classForTerm);
        }
      }
    } catch { /* noop */ }
  }

  useEffect(() => {
    if (!bookMeta) return;
    let cancelled = false;
    (async () => {
      // Solo las palabras del idioma del libro: el servidor filtra y así no
      // se descarga el vocabulario completo en cada apertura.
      const data = await fetchApi(
        `/words?language=${encodeURIComponent(bookMeta.language)}`,
      ).catch(() => []);
      if (cancelled) return;
      const langWords = (
        data as (SavedWordData & { language: string })[]
      ).filter((w) => w.status !== "ignored");
      savedTermsRef.current = langWords.map((w) => w.term).filter(Boolean);
      savedWordsDataRef.current = langWords;
      savedStatusRef.current = new Map(
        langWords.map((w) => [w.term.toLowerCase(), w.status ?? "new"]),
      );
      rehighlightAll();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookMeta]);

  return {
    savedTermsRef,
    savedWordsDataRef,
    classForTerm,
    highlightSavedInDoc,
    rehighlightAll,
  };
}
