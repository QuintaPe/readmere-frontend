const DB_NAME = "audiobook-handles";
const STORE = "handles";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function removeHandle(bookId: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch { /* noop */ }
}

// --- OPFS (Origin Private File System) ---
// Stores the actual audio file so it persists across sessions without re-picking.

function opfsName(bookId: string) {
  return `audiobook-${bookId}`;
}

export async function saveFileToOPFS(
  bookId: string,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const fh = await root.getFileHandle(opfsName(bookId), { create: true });
  const writable = await fh.createWritable();
  const CHUNK = 4 * 1024 * 1024; // 4 MB chunks
  let offset = 0;
  while (offset < file.size) {
    const blob = file.slice(offset, offset + CHUNK);
    await writable.write(blob);
    offset += CHUNK;
    onProgress?.(Math.min(offset / file.size, 1));
  }
  await writable.close();
}

export async function loadFileFromOPFS(bookId: string): Promise<File | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fh = await root.getFileHandle(opfsName(bookId));
    return await fh.getFile();
  } catch {
    return null;
  }
}

export async function removeFileFromOPFS(bookId: string): Promise<void> {
  try {
    const root = await navigator.storage.getDirectory();
    await root.removeEntry(opfsName(bookId));
  } catch { /* noop */ }
}

export function opfsSupported(): boolean {
  return typeof navigator !== "undefined" && "storage" in navigator &&
    typeof navigator.storage.getDirectory === "function";
}

// --- Streaming via Service Worker (soporte HTTP Range) ---
// El SW (public/opfs-sw.js) sirve el archivo de OPFS por rangos de bytes, para
// que <audio> haga streaming en vez de materializar un blob entero (lento en iPad).

export function audioMimeFor(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "mp3": return "audio/mpeg";
    case "ogg": return "audio/ogg";
    case "opus": return "audio/ogg";
    case "aac": return "audio/aac";
    case "wav": return "audio/wav";
    // m4a / m4b / mp4 y desconocidos → contenedor MP4
    default: return "audio/mp4";
  }
}

/**
 * Devuelve una URL servida por el service worker para hacer streaming del
 * audiolibro guardado en OPFS, o null si el SW no está activo/controlando la
 * página o no puede servir el archivo (p. ej. en `vite dev`, donde el SW no
 * corre). En ese caso el llamador debe recurrir al blob URL clásico.
 */
export async function opfsAudioStreamUrl(
  bookId: string,
  mime: string,
): Promise<string | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  // Si no hay un SW controlando esta pestaña (p. ej. en `vite dev`, o en la
  // primera carga antes de que active), no puede interceptar el fetch. Se
  // comprueba de forma SÍNCRONA: no usamos `serviceWorker.ready`, que nunca se
  // resuelve cuando no hay ningún SW registrado y colgaría la restauración.
  if (!navigator.serviceWorker.controller) return null;
  try {
    const url = `/opfs-audio/${encodeURIComponent(bookId)}?type=${encodeURIComponent(mime)}`;
    // Sonda: confirmamos que el SW responde al rango antes de usarlo como src.
    const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
    if (res.status === 206 || res.status === 200) return url;
  } catch {
    /* noop → fallback a blob */
  }
  return null;
}
