import { useMemo } from "react";
import { deleteDeck } from "@/modules/decks";
import { useDeckList, invalidateDecks } from "@/hooks/useCollections";
import { useUndoableDelete } from "@/hooks/useUndoableDelete";

export function useDecks() {
  const { decks: raw, loading } = useDeckList();

  // Borrado con deshacer: el mazo desaparece al instante y el DELETE real
  // se difiere 5s (deshacer conserva el mazo y sus palabras asociadas).
  const { pendingDelete, queueDelete } = useUndoableDelete({
    onDelete: deleteDeck,
    onDeleted: invalidateDecks,
    label: "Mazo eliminado",
  });

  const decks = useMemo(
    () =>
      [...raw]
        .filter((d) => !pendingDelete.has(d.id))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [raw, pendingDelete],
  );

  return { decks, loading, remove: queueDelete, invalidate: invalidateDecks };
}
