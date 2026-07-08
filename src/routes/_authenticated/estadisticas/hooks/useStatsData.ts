import { useState, useEffect } from "react";
import { useAuth } from "@/auth/auth-context";
import { listWords } from "@/modules/words";
import { listBooks } from "@/modules/books";
import { listStudySessions } from "@/modules/study-sessions";
import { listReviewLogs, type ReviewLog } from "@/modules/review-logs";
import type { StudySession } from "@/types";

interface SessionTotals {
  reviews: number;
  added: number;
  minutes: number;
}

// Constructores de series ancladas a "ahora", fuera del hook: leer el reloj
// durante el render viola las reglas de pureza de React (react-hooks/purity).

/** Actividad por día de los últimos 30 días (huecos a cero). */
function buildLast30Days(sessions: StudySession[]) {
  const days: Array<{ day: string; reviews: number; added: number; minutes: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const s = sessions.find((x) => x.day === d);
    days.push({
      day: d,
      reviews: s?.reviews ?? 0,
      added: s?.wordsAdded ?? 0,
      minutes: s?.readingMinutes ?? 0,
    });
  }
  return days;
}

/** Previsión: cuántas cartas vencen cada uno de los próximos 14 días.
 * El día 0 acumula también las atrasadas (todas caen "hoy" al repasar). */
function buildForecast(scheduled: Array<{ srsDue: string }>) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const forecast: Array<{ day: string; count: number }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(Date.now() + i * 86400000).toISOString().slice(0, 10);
    const count = scheduled.filter((w) => {
      const due = w.srsDue.slice(0, 10);
      return i === 0 ? due <= todayStr : due === d;
    }).length;
    forecast.push({ day: d, count });
  }
  return forecast;
}

/** Heatmap tipo GitHub: últimas 26 semanas en columnas, lunes arriba. */
function buildHeatWeeks(allSessions: StudySession[]) {
  const byDay = new Map<string, number>();
  for (const s of allSessions) byDay.set(s.day, s.reviews + (s.wordsAdded ?? 0));
  const dow = (new Date().getDay() + 6) % 7; // lunes = 0
  const heatDays: Array<{ day: string; total: number }> = [];
  const back = 25 * 7 + dow; // desde el lunes de hace 25 semanas hasta hoy
  for (let i = back; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    heatDays.push({ day: d, total: byDay.get(d) ?? 0 });
  }
  const heatWeeks: Array<Array<{ day: string; total: number }>> = [];
  for (let i = 0; i < heatDays.length; i += 7)
    heatWeeks.push(heatDays.slice(i, i + 7));
  return { heatWeeks, maxHeat: Math.max(1, ...heatDays.map((d) => d.total)) };
}

export function useStatsData() {
  const { user } = useAuth();
  const [words, setWords] = useState<Awaited<ReturnType<typeof listWords>>>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [allSessions, setAllSessions] = useState<StudySession[]>([]);
  const [books, setBooks] = useState<Awaited<ReturnType<typeof listBooks>>>([]);
  const [reviewLogs, setReviewLogs] = useState<ReviewLog[]>([]);

  useEffect(() => {
    const from30 = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
    Promise.all([
      listWords().catch(() => []),
      listStudySessions().catch((): StudySession[] => []),
      listBooks().catch(() => []),
      listReviewLogs(30).catch((): ReviewLog[] => []),
    ]).then(([w, s, b, r]) => {
      setWords(w);
      setSessions(s.filter((x) => x.day >= from30));
      setAllSessions(s);
      setBooks(b);
      setReviewLogs(r);
    });
  }, [user.id]);

  const byStatus = {
    new: words.filter((w) => w.status === "new").length,
    learning: words.filter((w) => w.status === "learning").length,
    known: words.filter((w) => w.status === "known").length,
    ignored: words.filter((w) => w.status === "ignored").length,
  };
  const total = words.length || 1;

  const totals = sessions.reduce<SessionTotals>(
    (a, s) => ({
      reviews: a.reviews + s.reviews,
      added: a.added + (s.wordsAdded ?? 0),
      minutes: a.minutes + (s.readingMinutes ?? 0),
    }),
    { reviews: 0, added: 0, minutes: 0 },
  );

  const days = buildLast30Days(sessions);
  const maxBar = Math.max(1, ...days.map((d) => d.reviews + d.added));

  const activeDays = sessions.filter(
    (s) => s.reviews + (s.wordsAdded ?? 0) > 0,
  ).length;

  const scheduled = words.filter(
    (w) => w.status !== "ignored" && w.srsReps > 0,
  );
  const forecast = buildForecast(scheduled);
  const maxForecast = Math.max(1, ...forecast.map((f) => f.count));

  const { heatWeeks, maxHeat } = buildHeatWeeks(allSessions);

  // Retención: % de repasos NO fallados ("De nuevo" = rating 0) en 30 días.
  // null hasta que haya un mínimo de datos para que el número signifique algo.
  const retention =
    reviewLogs.length >= 10
      ? Math.round(
          (reviewLogs.filter((r) => r.rating > 0).length / reviewLogs.length) *
            100,
        )
      : null;

  return {
    retention,
    reviewLogCount: reviewLogs.length,
    forecast,
    maxForecast,
    heatWeeks,
    maxHeat,
    words,
    sessions,
    books,
    byStatus,
    total,
    totals,
    days,
    maxBar,
    activeDays,
  };
}
