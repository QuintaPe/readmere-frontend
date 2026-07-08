import type { Word } from "@/types";

export type StudyMode = "normal" | "reverse" | "typing" | "cloze";

export const STUDY_MODE_KEY = "study_mode";

export const STUDY_MODES: { key: StudyMode; label: string }[] = [
  { key: "normal", label: "Clásico" },
  { key: "reverse", label: "Inversa" },
  { key: "typing", label: "Escritura" },
  { key: "cloze", label: "Cloze" },
];

// Oculta el término dentro de la frase de ejemplo. Devuelve null si la frase
// no contiene el término (ahí el modo cloze no tiene sentido para esa carta).
export function clozeSentence(example: string, term: string): string | null {
  const t = term.trim();
  if (!t) return null;
  const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\b${escaped}\\w*\\b`, "gi");
  if (!re.test(example)) return null;
  return example.replace(re, "_____");
}

// Comparación tolerante para el modo escritura: ignora mayúsculas, tildes
// y espacios de sobra.
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Si a la carta le faltan los datos que el modo necesita, cae al clásico.
export function effectiveMode(card: Word, mode: StudyMode): StudyMode {
  if (mode === "cloze") {
    if (card.example && clozeSentence(card.example, card.term)) return "cloze";
    return "normal";
  }
  if ((mode === "reverse" || mode === "typing") && !card.translation)
    return "normal";
  return mode;
}
