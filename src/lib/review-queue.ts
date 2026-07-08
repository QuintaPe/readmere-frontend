import { updateWord } from "@/modules/words";
import type { SrsUpdate } from "@/lib/srs";

// Cola de repasos pendientes de sincronizar: si updateWord falla (sin red,
// backend caído), el resultado del repaso se guarda aquí y se reintenta al
// recuperar conexión o al arrancar la app. Solo se conserva el último estado
// por palabra: un repaso posterior ya incluye el efecto del anterior.

const QUEUE_KEY = "review_sync_queue";

type QueuedReview = SrsUpdate & { queuedAt: string };

function readQueue(): Record<string, QueuedReview> {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeQueue(q: Record<string, QueuedReview>) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    /* localStorage lleno: el repaso se pierde, igual que antes de la cola */
  }
}

export function enqueueReview(wordId: string, update: SrsUpdate) {
  const q = readQueue();
  q[wordId] = { ...update, queuedAt: new Date().toISOString() };
  writeQueue(q);
}

export function pendingReviewCount(): number {
  return Object.keys(readQueue()).length;
}

let flushing = false;

export async function flushReviewQueue(): Promise<number> {
  if (flushing) return 0;
  flushing = true;
  let synced = 0;
  try {
    const q = readQueue();
    for (const [wordId, { queuedAt: _queuedAt, ...update }] of Object.entries(
      q,
    )) {
      try {
        await updateWord(wordId, update);
        const current = readQueue();
        delete current[wordId];
        writeQueue(current);
        synced++;
      } catch {
        // Sigue sin haber red (o la palabra ya no existe tras varios días):
        // se reintentará en el próximo flush.
      }
    }
  } finally {
    flushing = false;
  }
  return synced;
}

// Reintenta al volver la conexión. Idempotente: solo registra una vez.
let listening = false;
export function startReviewQueueSync() {
  if (listening) return;
  listening = true;
  window.addEventListener("online", () => void flushReviewQueue());
  void flushReviewQueue();
}
