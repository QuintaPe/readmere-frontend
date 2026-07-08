import { useState } from "react";
import type { Chapter } from "@/types/reader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UseEpubSearchProps {
  bookRef: React.MutableRefObject<Any>;
  chaptersRef: React.MutableRefObject<Chapter[]>;
}

export function useEpubSearch({ bookRef, chaptersRef }: UseEpubSearchProps) {
  const [searchResults, setSearchResults] = useState<
    { cfi: string; excerpt: string; chapter: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);

  async function runSearch(query: string) {
    const book = bookRef.current;
    if (!book || !query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    setSearchResults([]);
    try {
      const results: { cfi: string; excerpt: string; chapter: string }[] = [];
      const spineItems: Any[] = book.spine?.spineItems || [];
      for (const item of spineItems) {
        try {
          await item.load(book.load.bind(book));
          const found: { cfi: string; excerpt: string }[] = item.find(query) || [];
          const chapterEntry = chaptersRef.current.find((c) => {
            const base = c.href.split("#")[0];
            return (
              item.href?.endsWith(base) ||
              base.endsWith(item.href) ||
              item.href === base
            );
          });
          const chapterLabel = chapterEntry?.label || item.href || "";
          for (const f of found) {
            results.push({ cfi: f.cfi, excerpt: f.excerpt, chapter: chapterLabel });
            if (results.length >= 50) break;
          }
          item.unload();
        } catch { /* skip item */ }
        if (results.length >= 50) break;
      }
      setSearchResults(results);
    } finally {
      setSearchLoading(false);
    }
  }

  return { searchResults, searchLoading, runSearch };
}
