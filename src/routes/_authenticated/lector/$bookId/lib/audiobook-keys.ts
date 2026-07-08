// Todas las claves de localStorage por audiolibro viven aquí. Si añades una
// clave nueva, añádela también a clearAudiobookStorage: es lo que garantiza
// que quitar el audiolibro no deje datos huérfanos.

export function audiobookKeys(bookId: string) {
  return {
    fileName: `audiobook-filename-${bookId}`,
    position: `audiobook-pos-${bookId}`,
    chapters: `audiobook-chapters-${bookId}`,
    chapterMap: `audiobook-map-${bookId}`,
    chapterTitles: `audiobook-titles-${bookId}`,
    /** Ajuste fino del cursor de audio, guardado por capítulo. */
    cursorOffset: (chapterIdx: number) =>
      `ab-coffset-${bookId}-${chapterIdx}`,
  };
}

export function clearAudiobookStorage(bookId: string) {
  const k = audiobookKeys(bookId);
  for (const key of [
    k.fileName,
    k.position,
    k.chapters,
    k.chapterMap,
    k.chapterTitles,
  ]) {
    localStorage.removeItem(key);
  }
}
