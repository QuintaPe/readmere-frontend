import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadEpubToStorage(
  file: File,
  userId: string,
): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("books").upload(path, file, {
    contentType: "application/epub+zip",
    upsert: false,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("books").getPublicUrl(path);
  return data.publicUrl;
}

// Extrae la ruta interna del bucket a partir de la URL pública guardada en
// books.filePath (formato .../storage/v1/object/public/books/<ruta>).
function storagePathFromUrl(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    const prefix = "/storage/v1/object/public/books/";
    return url.pathname.startsWith(prefix)
      ? decodeURIComponent(url.pathname.slice(prefix.length))
      : null;
  } catch {
    return null;
  }
}

/**
 * Resuelve la URL de descarga de un EPUB. Si el bucket es privado, obtiene
 * una URL firmada temporal; si es público (o falla la firma), devuelve la
 * URL original. Así la app funciona igual antes y después de hacer privado
 * el bucket `books` en el dashboard de Supabase.
 *
 * Nota: para bucket privado hace falta una policy de storage que permita
 * `select` sobre `storage.objects` al rol usado por esta app.
 */
export async function resolveEpubUrl(filePath: string): Promise<string> {
  const path = storagePathFromUrl(filePath);
  if (!path) return filePath; // URL externa o formato desconocido
  try {
    const { data, error } = await supabase.storage
      .from("books")
      .createSignedUrl(path, 60 * 60); // 1 hora: de sobra para abrir y cachear
    if (error || !data?.signedUrl) return filePath;
    return data.signedUrl;
  } catch {
    return filePath;
  }
}

export async function deleteEpubFromStorage(publicUrl: string): Promise<void> {
  const filePath = storagePathFromUrl(publicUrl);
  if (!filePath) return;
  await supabase.storage.from("books").remove([filePath]);
}
