import { fetchApi } from "@/lib/api";
import type { AdminWord, PagedResponse } from "@/types";

export function listAdminWords(
  page: number,
  limit: number,
  search: string,
): Promise<PagedResponse<AdminWord>> {
  return fetchApi(
    `/admin/words?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  );
}

export function deleteAdminWord(id: string): Promise<void> {
  return fetchApi(`/admin/words/${id}`, { method: "DELETE" });
}
