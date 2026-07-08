import { listAdminBooks, deleteAdminBook } from "@/modules/admin/books";
import {
  useAdminList,
  withToast,
  ADMIN_PAGE_SIZE,
} from "../../hooks/useAdminList";
import type { AdminBook, PagedResponse } from "@/types";

export type { AdminBook, PagedResponse };

export const LIMIT = ADMIN_PAGE_SIZE;

export function useAdminBooks() {
  const list = useAdminList(listAdminBooks);

  const deleteBook = (id: string) =>
    withToast(deleteAdminBook(id), "Libro eliminado", list.invalidate);

  return { ...list, deleteBook };
}
