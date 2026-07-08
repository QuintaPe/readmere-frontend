import { listAdminDecks, deleteAdminDeck } from "@/modules/admin/decks";
import {
  useAdminList,
  withToast,
  ADMIN_PAGE_SIZE,
} from "../../hooks/useAdminList";
import type { AdminDeck, PagedResponse } from "@/types";

export type { AdminDeck, PagedResponse };

export const LIMIT = ADMIN_PAGE_SIZE;

export function useAdminDecks() {
  const list = useAdminList(listAdminDecks);

  const deleteDeck = (id: string) =>
    withToast(deleteAdminDeck(id), "Mazo eliminado", list.invalidate);

  return { ...list, deleteDeck };
}
