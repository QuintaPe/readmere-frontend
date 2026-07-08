import { fetchApi } from "@/lib/api";
import type { AdminBook, PagedResponse } from "@/types";

export function listAdminBooks(
  page: number,
  limit: number,
  search: string,
): Promise<PagedResponse<AdminBook>> {
  return fetchApi(
    `/admin/books?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  );
}

export function deleteAdminBook(id: string): Promise<void> {
  return fetchApi(`/admin/books/${id}`, { method: "DELETE" });
}
