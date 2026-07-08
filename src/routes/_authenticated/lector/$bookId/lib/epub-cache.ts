const EPUB_DB = "epub-cache-v1";
const EPUB_STORE = "epubs";

function openEpubDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(EPUB_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(EPUB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getEpubFromCache(
  bookId: string,
): Promise<ArrayBuffer | null> {
  try {
    const db = await openEpubDb();
    return new Promise((resolve) => {
      const tx = db.transaction(EPUB_STORE, "readonly");
      const req = tx.objectStore(EPUB_STORE).get(bookId);
      req.onsuccess = () => {
        const result = req.result as ArrayBuffer | undefined;
        resolve(result ?? null);
      };
      req.onerror = () => { console.error("[EpubCache] get error", req.error); resolve(null); };
    });
  } catch {
    return null;
  }
}

// Al borrar un libro hay que borrar también su copia local: si no, cada EPUB
// eliminado queda huérfano en IndexedDB para siempre (varios MB cada uno).
export async function deleteEpubFromCache(bookId: string): Promise<void> {
  try {
    const db = await openEpubDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(EPUB_STORE, "readwrite");
      tx.objectStore(EPUB_STORE).delete(bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // best-effort
      tx.onabort = () => resolve();
    });
  } catch {
    /* best-effort */
  }
}

export async function saveEpubToCache(
  bookId: string,
  buf: ArrayBuffer,
): Promise<void> {
  try {
    const db = await openEpubDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(EPUB_STORE, "readwrite");
      tx.objectStore(EPUB_STORE).put(buf, bookId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => { console.error("[EpubCache] save error", tx.error); reject(tx.error); };
      tx.onabort = () => { console.error("[EpubCache] save aborted", tx.error); reject(tx.error); };
    });
  } catch (e) {
    console.error("[EpubCache] save failed:", e);
  }
}
