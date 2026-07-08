import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// El elemento desaparece de la vista al instante pero el DELETE real se
// retrasa UNDO_WINDOW_MS, dando margen a recuperarlo con todo intacto
// (recrearlo perdería SRS, relaciones, historial, archivos...).
const UNDO_WINDOW_MS = 5000;

interface UndoableDeleteOptions {
  /** Ejecuta el borrado real en el servidor (y limpieza asociada). */
  onDelete: (id: string) => Promise<unknown>;
  /** Tras completarse el borrado real, p. ej. invalidar la caché de la lista. */
  onDeleted?: () => void;
  /** Título del toast de deshacer. */
  label?: string;
}

/**
 * Borrado optimista con ventana de "Deshacer" reutilizable para cualquier
 * entidad (palabras, libros, mazos...). Oculta el id de la vista al instante
 * y difiere el borrado real; si el usuario deshace, nunca llega a borrarse.
 */
export function useUndoableDelete({
  onDelete,
  onDeleted,
  label = "Elemento eliminado",
}: UndoableDeleteOptions) {
  // Ids ocultos de la vista a la espera del DELETE real
  const [pendingDelete, setPendingDelete] = useState<Set<string>>(new Set());
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const onDeleteRef = useRef(onDelete);
  const onDeletedRef = useRef(onDeleted);
  useEffect(() => {
    onDeleteRef.current = onDelete;
    onDeletedRef.current = onDeleted;
  });

  useEffect(() => {
    const t = timers.current;
    return () => {
      // Al desmontar, ejecuta los borrados aún pendientes e invalida la
      // caché (si no, al volver se ve la lista vieja con el elemento ya
      // borrado en el servidor).
      for (const [id, timer] of t) {
        clearTimeout(timer);
        onDeleteRef
          .current(id)
          .then(() => onDeletedRef.current?.())
          .catch(() => {});
      }
      t.clear();
    };
  }, []);

  function undoDelete(id: string) {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setPendingDelete((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }

  /** Encola el borrado con toast de deshacer. Devuelve false si ya estaba encolado. */
  function queueDelete(id: string): boolean {
    if (timers.current.has(id)) return false;
    setPendingDelete((s) => new Set(s).add(id));

    const timer = setTimeout(async () => {
      timers.current.delete(id);
      try {
        await onDeleteRef.current(id);
        onDeletedRef.current?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al eliminar");
      }
      setPendingDelete((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }, UNDO_WINDOW_MS);
    timers.current.set(id, timer);

    toast(label, {
      action: { label: "Deshacer", onClick: () => undoDelete(id) },
      duration: UNDO_WINDOW_MS,
    });
    return true;
  }

  return { pendingDelete, queueDelete };
}
