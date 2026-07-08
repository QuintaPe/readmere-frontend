import { fetchApi } from "@/lib/api";
import type { AdminDeck, PagedResponse } from "@/types";

export function listAdminDecks(
  page: number,
  limit: number,
  search: string,
): Promise<PagedResponse<AdminDeck>> {
  return fetchApi(
    `/admin/decks?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  );
}

export function deleteAdminDeck(id: string): Promise<void> {
  return fetchApi(`/admin/decks/${id}`, { method: "DELETE" });
}
