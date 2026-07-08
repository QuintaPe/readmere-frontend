import { useState } from "react";
import { toast } from "sonner";
import { getProfile } from "@/modules/profiles";
import { updateWord } from "@/modules/words";
import { enrichWordsBatch, missingEnrichFields } from "@/lib/ai.functions";
import type { Word } from "@/types";

// Lotes pequeños: el JSON de respuesta crece con cada palabra y los modelos
// empiezan a recortar campos con listas largas.
const BATCH = 15;

/** Rellena con IA los campos vacíos de las palabras dadas (solo los vacíos). */
export function useEnrichWords() {
  const [enriching, setEnriching] = useState(false);

  async function enrichWords(words: Word[]): Promise<boolean> {
    const candidates = words.filter((w) => missingEnrichFields(w).length > 0);
    if (!candidates.length) {
      toast.info("Las palabras seleccionadas ya tienen todos los campos");
      return false;
    }
    setEnriching(true);
    try {
      const target = await getProfile()
        .then((p) => p.nativeLanguage || "es")
        .catch(() => "es");
      let filled = 0;
      for (let i = 0; i < candidates.length; i += BATCH) {
        const batch = candidates.slice(i, i + BATCH);
        const result = await enrichWordsBatch(batch, target);
        for (const [id, fields] of Object.entries(result)) {
          await updateWord(id, fields);
          filled++;
        }
      }
      toast.success(
        filled
          ? `${filled} ${filled === 1 ? "palabra completada" : "palabras completadas"} con IA`
          : "La IA no devolvió datos para estas palabras",
      );
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al completar con IA");
      return false;
    } finally {
      setEnriching(false);
    }
  }

  return { enriching, enrichWords };
}
