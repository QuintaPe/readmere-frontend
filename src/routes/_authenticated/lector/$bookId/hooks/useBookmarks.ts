import { useState, useRef, useEffect } from "react";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";
import type { BookmarkEntry } from "@/types/reader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

interface UseBookmarksProps {
  bookId: string | undefined;
  renditionRef: React.MutableRefObject<Any>;
  currentCfiRef: React.MutableRefObject<string>;
  currentExcerptRef: React.MutableRefObject<string>;
  currentChapter: string;
  applyBookmarkAnnotations: () => void;
  rehighlightBookmarkPhrases: () => void;
}

export function useBookmarks({
  bookId,
  currentCfiRef,
  currentExcerptRef,
  currentChapter,
  applyBookmarkAnnotations,
  rehighlightBookmarkPhrases,
}: UseBookmarksProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const bookmarksRef = useRef<BookmarkEntry[]>([]);
  const bookmarkPhrasesRef = useRef<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [bookmarkNote, setBookmarkNote] = useState("");
  const [bookmarkPhrase, setBookmarkPhrase] = useState("");

  // Load bookmarks
  useEffect(() => {
    if (!bookId) return;
    fetchApi(`/bookmarks?bookId=${bookId}`)
      .then((rows) => {
        if (Array.isArray(rows)) setBookmarks(rows);
      })
      .catch(() => { });
  }, [bookId]);

  // Sync bookmarks to refs and re-highlight
  useEffect(() => {
    bookmarksRef.current = bookmarks;
    bookmarkPhrasesRef.current = bookmarks.map((b) => b.phrase).filter(Boolean);
    applyBookmarkAnnotations();
    rehighlightBookmarkPhrases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]);

  async function addBookmark() {
    const cfi = currentCfiRef.current;
    if (!cfi || !bookId) return;
    try {
      const result = await fetchApi("/bookmarks", {
        method: "POST",
        body: JSON.stringify({
          bookId,
          cfi,
          chapter: currentChapter,
          note: bookmarkNote.trim(),
          phrase: bookmarkPhrase,
          excerpt: currentExcerptRef.current,
        }),
      });
      const entry: BookmarkEntry = {
        id: result.id,
        cfi,
        chapter: currentChapter,
        note: bookmarkNote.trim(),
        phrase: bookmarkPhrase,
        excerpt: currentExcerptRef.current,
        createdAt: new Date().toISOString(),
      };
      setBookmarks((prev) => [entry, ...prev]);
      setBookmarkNote("");
      setBookmarkPhrase("");
      setShowAddBookmark(false);
      toast.success("Marcador guardado");
    } catch {
      toast.error("Error al guardar el marcador");
    }
  }

  async function deleteBookmark(id: string) {
    try {
      await fetchApi(`/bookmarks/${id}`, { method: "DELETE" });
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Error al eliminar el marcador");
    }
  }

  return {
    bookmarks,
    setBookmarks,
    bookmarksRef,
    bookmarkPhrasesRef,
    showBookmarks,
    setShowBookmarks,
    showAddBookmark,
    setShowAddBookmark,
    bookmarkNote,
    setBookmarkNote,
    bookmarkPhrase,
    setBookmarkPhrase,
    addBookmark,
    deleteBookmark,
  };
}
