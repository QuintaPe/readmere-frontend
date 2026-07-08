import { listAdminWords, deleteAdminWord } from "@/modules/admin/words";
import {
  useAdminList,
  withToast,
  ADMIN_PAGE_SIZE,
} from "../../hooks/useAdminList";
import type { AdminWord, PagedResponse } from "@/types";

export type { AdminWord, PagedResponse };

export const LIMIT = ADMIN_PAGE_SIZE;

export function useAdminWords() {
  const list = useAdminList(listAdminWords);

  const deleteWord = (id: string) =>
    withToast(deleteAdminWord(id), "Palabra eliminada", list.invalidate);

  return { ...list, deleteWord };
}
