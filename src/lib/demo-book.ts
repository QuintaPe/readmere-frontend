import { uploadBook } from "@/modules/books";
import type { Book } from "@/types";

// Libro de ejemplo para el onboarding: un clásico de dominio público servido
// desde el propio frontend (public/demo/), así no depende de Supabase ni de
// CORS de terceros y funciona igual en local y en producción. La ruta es
// relativa: resolveEpubUrl la deja pasar tal cual y el lector hace
// fetch("/demo/...") contra el mismo origen.
export const DEMO_BOOK_PATH = "/demo/alice-in-wonderland.epub";

export function findDemoBook(books: Book[]): Book | undefined {
  return books.find((b) => b.filePath === DEMO_BOOK_PATH);
}

export function addDemoBook(): Promise<Book> {
  return uploadBook({
    filePath: DEMO_BOOK_PATH,
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    language: "en",
    coverPath: "https://www.gutenberg.org/cache/epub/11/pg11.cover.medium.jpg",
    synopsis:
      "Alicia cae por una madriguera y aparece en un mundo absurdo y maravilloso. " +
      "Un clásico de dominio público (Proyecto Gutenberg), perfecto para probar el lector: " +
      "toca cualquier palabra para traducirla y guardarla en tu vocabulario.",
    genre: "Fantasía",
    publishedYear: 1865,
  });
}
