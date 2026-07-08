// SM-2 spaced repetition. Ratings: 0=again, 1=hard, 2=good, 3=easy.
// Level 1–10: 1 = nueva, 10 = totalmente aprendida.

export function srsToLevel(srsInterval: number, srsReps: number): number {
  if (!srsReps || srsReps === 0) return 1;
  if (srsInterval <= 1) return 2;
  if (srsInterval <= 3) return 3;
  if (srsInterval <= 6) return 4;
  if (srsInterval <= 10) return 5;
  if (srsInterval <= 17) return 6;
  if (srsInterval <= 25) return 7;
  if (srsInterval <= 40) return 8;
  if (srsInterval <= 90) return 9;
  return 10;
}

// Color gradient 1–10: red → amber → green → teal
export function levelColor(level: number): string {
  const colors = [
    "",
    "#ef4444", // 1 red
    "#f97316", // 2 orange
    "#f59e0b", // 3 amber
    "#eab308", // 4 yellow
    "#84cc16", // 5 lime
    "#22c55e", // 6 green
    "#10b981", // 7 emerald
    "#14b8a6", // 8 teal
    "#06b6d4", // 9 cyan
    "#3b82f6", // 10 blue
  ];
  return colors[Math.max(1, Math.min(10, level))];
}
// Una palabra con muchos fallos acumulados es una "leech": consume repasos
// sin aprenderse. Conviene reescribir su ejemplo/traducción o suspenderla.
export const LEECH_THRESHOLD = 6;

export function isLeech(card: { srsLapses: number }): boolean {
  return card.srsLapses >= LEECH_THRESHOLD;
}

// Keys match the camelCase API/DB response from Drizzle.
export type SrsRating = 0 | 1 | 2 | 3;

export interface SrsCard {
  srsInterval: number; // days
  srsEase: number; // multiplier, default 2.5
  srsReps: number; // successful reviews in a row
  srsLapses: number; // times forgotten
}

export interface SrsUpdate {
  srsInterval: number;
  srsEase: number;
  srsReps: number;
  srsLapses: number;
  srsDue: string; // ISO
  status: "new" | "learning" | "known" | "ignored";
  lastReviewedAt: string;
}

// Cap the interval so a long streak of "easy" ratings can't overflow the Date
// range (which threw "Invalid time value"). One year is plenty for a mastered word.
const MAX_INTERVAL_DAYS = 365;

// Intervalo a partir del cual una tarjeta cuenta como dominada ("madura" en
// Anki). DEBE coincidir con KNOWN_INTERVAL_DAYS en backend/src/routes/words.ts:
// el servidor re-deriva el status con este mismo umbral en cada PUT.
export const KNOWN_INTERVAL_DAYS = 21;

// ±5% de fuzz en intervalos maduros para que las palabras añadidas el mismo
// día no venzan siempre juntas en oleadas (mismo truco que usa Anki).
// `rng` es inyectable para que los tests sean deterministas.
function fuzzInterval(days: number, rng: () => number): number {
  if (days < 3) return days;
  return Math.max(1, Math.round(days * (0.95 + rng() * 0.1)));
}

export function applySrs(
  card: SrsCard,
  rating: SrsRating,
  rng: () => number = Math.random,
): SrsUpdate {
  let { srsInterval, srsEase, srsReps, srsLapses } = card;

  // Defaults for brand-new cards
  if (!srsInterval) srsInterval = 0;
  if (!srsEase) srsEase = 2.5;
  if (!srsReps) srsReps = 0;
  if (!srsLapses) srsLapses = 0;

  const now = new Date();
  let dueDate: Date;

  if (rating === 0) {
    // Again — reset, requeue in 10 min
    srsReps = 0;
    srsLapses += 1;
    srsEase = Math.max(1.3, srsEase - 0.2);
    srsInterval = 0;
    dueDate = new Date(now.getTime() + 10 * 60 * 1000);
  } else {
    // First two reps use fixed intervals
    if (srsReps === 0) {
      srsInterval = rating === 3 ? 3 : 1;
    } else if (srsReps === 1) {
      srsInterval = rating === 3 ? 6 : rating === 2 ? 4 : 3;
    } else {
      const mult = rating === 1 ? 1.2 : rating === 2 ? srsEase : srsEase * 1.3;
      srsInterval = Math.max(1, Math.round(srsInterval * mult));
      srsInterval = fuzzInterval(srsInterval, rng);
    }
    srsInterval = Math.min(srsInterval, MAX_INTERVAL_DAYS);
    srsEase = Math.min(2.8, Math.max(1.3, srsEase + (rating - 2) * 0.1));
    srsReps += 1;
    dueDate = new Date(now.getTime() + srsInterval * 24 * 60 * 60 * 1000);
  }

  // Internal status derived from the interval (for DB/filtering). Same rule
  // as the server so both layers always agree on what counts as "known".
  const status: SrsUpdate["status"] =
    srsInterval >= KNOWN_INTERVAL_DAYS ? "known" : srsReps === 0 ? "new" : "learning";

  return {
    srsInterval,
    srsEase,
    srsReps,
    srsLapses,
    srsDue: dueDate.toISOString(),
    status,
    lastReviewedAt: now.toISOString(),
  };
}
