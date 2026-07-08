import { exportCsv, parseCsv, downloadBlob } from "@/lib/csv";
import type { Word } from "@/types";

/** Exporta las palabras visibles como CSV reimportable (columna `term` obligatoria). */
export function exportWordsCsv(words: Word[]) {
  exportCsv(
    `vocabulario-${Date.now()}`,
    words.map((w) => ({
      term: w.term,
      translation: w.translation ?? "",
      definition: w.definition ?? "",
      example: w.example ?? "",
      language: w.language,
      phonetic: w.phonetic ?? "",
      partOfSpeech: w.partOfSpeech ?? "",
      synonyms: w.synonyms ?? "",
    })),
  );
}

/**
 * Exporta para Anki: TSV Front <TAB> Back con campos HTML. La cabecera de
 * comentarios le dice a Anki el separador y que los campos llevan HTML.
 */
export function exportWordsAnki(words: Word[]) {
  const esc = (s: string) => s.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");
  const lines = words.map((w) => {
    const front = [w.term, w.phonetic ? `<br><small>${w.phonetic}</small>` : ""]
      .join("");
    const back = [
      w.translation && `<b>${w.translation}</b>`,
      w.partOfSpeech && `<i>${w.partOfSpeech}</i>`,
      w.definition,
      w.example && `<br><span style="color:#888">${w.example}</span>`,
    ]
      .filter(Boolean)
      .join("<br>");
    return `${esc(front)}\t${esc(back)}`;
  });
  const content = ["#separator:tab", "#html:true", ...lines].join("\n");
  downloadBlob(
    `anki-${Date.now()}.txt`,
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
}

export type ImportedWordRow = {
  term: string;
  translation: string | null;
  definition: string | null;
  example: string | null;
  language: string;
};

/**
 * Convierte un CSV en filas para POST /words/batch. Devuelve un error legible
 * (para el toast) si el archivo no tiene la forma esperada.
 */
export function parseWordsCsv(
  text: string,
): { rows: ImportedWordRow[] } | { error: string } {
  const { headers, records } = parseCsv(text);
  if (!headers.includes("term")) return { error: "CSV debe tener columna 'term'" };
  const rows = records
    .map((r) => ({
      term: r.term?.trim(),
      translation: r.translation?.trim() || null,
      definition: r.definition?.trim() || null,
      example: r.example?.trim() || null,
      language: r.language?.trim() || "en",
    }))
    .filter((r): r is ImportedWordRow => !!r.term);
  if (!rows.length) return { error: "Sin filas válidas" };
  return { rows };
}
