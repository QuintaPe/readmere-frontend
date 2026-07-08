import { fetchApi } from "@/lib/api";
import type { Book } from "@/types";

export function listBooks(): Promise<Book[]> {
  return fetchApi("/books");
}

export interface UploadBookPayload {
  filePath: string;
  title: string;
  author?: string | null;
  language?: string;
  coverPath?: string | null;
  synopsis?: string | null;
  genre?: string | null;
  publishedYear?: number | null;
}

export function uploadBook(payload: UploadBookPayload): Promise<Book> {
  return fetchApi("/books", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateBook(
  id: string,
  data: Partial<
    Pick<Book, "title" | "author" | "genre" | "publishedYear" | "synopsis" | "coverPath">
  >,
): Promise<Book> {
  return fetchApi(`/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteBook(id: string): Promise<void> {
  return fetchApi(`/books/${id}`, { method: "DELETE" });
}
