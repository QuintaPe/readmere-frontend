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
