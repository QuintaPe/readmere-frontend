import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { listWords, listWordsDue, updateWord } from "@/modules/words";
import { listDecks, listDeckWords } from "@/modules/decks";
import { getProfile } from "@/modules/profiles";
import { applySrs, srsToLevel, type SrsRating } from "@/lib/srs";
import { enqueueReview } from "@/lib/review-queue";
import { logReview } from "@/modules/review-logs";
import { bumpStudyToday } from "@/lib/streak";
import type { Word, Deck } from "@/types";

interface LastAction {
  card: Word;
  idx: number;
  wasAgain: boolean;
}

// The point of SRS: only surface cards that are actually due, plus a capped
// number of brand-new cards. Reviews come first, then new cards.
function buildDuePool(cards: Word[], newLimit: number): Word[] {
  const now = Date.now();
  const due = cards
    .filter((c) => c.srsReps > 0 && new Date(c.srsDue).getTime() <= now)
    .sort((a, b) => a.srsDue.localeCompare(b.srsDue));
  const fresh = cards.filter((c) => c.srsReps === 0).slice(0, newLimit);
  return [...due, ...fresh];
}

export function useFlashcardSession() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const deckId = searchParams.get("deck");

  const [showAnswer, setShowAnswer] = useState(false);
  const [idx, setIdx] = useState(0);
  const [sessionDone, setSessionDone] = useState(0);
  const [sessionAgain, setSessionAgain] = useState(0);
  const [sessionCards, setSessionCards] = useState<Word[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [sessionLevelUps, setSessionLevelUps] = useState(0);
  const [cramMode, setCramMode] = useState(false);

  const [deck, setDeck] = useState<Deck | undefined>();
  const [deckWordIds, setDeckWordIds] = useState<string[] | undefined>();
  const [allDeckCards, setAllDeckCards] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    getProfile()
      .then((p) => setNewCardsPerDay(p.newCardsPerDay ?? 10))
      .catch(() => {})
      .finally(() => setProfileLoaded(true));
  }, []);

  useEffect(() => {
    if (!deckId) return;
    listDecks()
      .then((data) => setDeck(data.find((d) => d.id === deckId)))
      .catch(() => {});
  }, [deckId]);

  useEffect(() => {
    if (!deckId) return;
    listDeckWords(deckId)
      .then((data) => setDeckWordIds(data.map((r) => r.word.id)))
      .catch(() => {});
  }, [deckId]);

  // Modo mazo: necesita el vocabulario completo para cruzarlo con los ids del mazo.
  useEffect(() => {
    if (!deckId || !deckWordIds) return;
    listWords()
      .then((allWords) => {
        if (deckWordIds.length === 0) {
          setAllDeckCards([]);
          return;
        }
        const idSet = new Set(deckWordIds);
        setAllDeckCards(
          allWords
            .filter((w) => idSet.has(w.id) && w.status !== "ignored")
            .sort((a, b) => a.srsDue.localeCompare(b.srsDue)),
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id, deckId, deckWordIds?.length]);

  // Modo global: el servidor devuelve solo vencidas + N nuevas (índice user_id+srs_due),
  // sin descargar todo el vocabulario. Este solo se pide si no hay nada pendiente,
  // para poder ofrecer "Modo libre" / "Repasar de nuevo".
  useEffect(() => {
    if (deckId || !profileLoaded) return;
    let cancelled = false;
    listWordsDue(newCardsPerDay)
      .then((pool) => {
        if (cancelled) return;
        if (pool.length > 0) {
          setSessionCards(pool);
          setSessionStarted(true);
          return;
        }
        return listWords().then((all) => {
          if (cancelled) return;
          setAllDeckCards(
            all
              .filter((w) => w.status !== "ignored")
              .sort((a, b) => a.srsDue.localeCompare(b.srsDue)),
          );
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user.id, deckId, profileLoaded, newCardsPerDay]);

  const cards = sessionStarted ? sessionCards : [];

  const reviewCount = useMemo(
    () => cards.filter((c) => c.srsReps > 0).length,
    [cards],
  );
  const newCount = useMemo(
    () => cards.filter((c) => c.srsReps === 0).length,
    [cards],
  );
  const card = cards[idx];

  // Cambio de mazo (o entrar/salir del modo mazo) → sesión a cero. Ajuste
  // durante el render (patrón documentado de React), no setState en efecto.
  const [prevDeckId, setPrevDeckId] = useState(deckId);
  if (deckId !== prevDeckId) {
    setPrevDeckId(deckId);
    setIdx(0);
    setShowAnswer(false);
    setSessionDone(0);
    setSessionAgain(0);
    setSessionLevelUps(0);
    setSessionStarted(false);
    setCramMode(false);
    setLastAction(null);
  }

  // Solo modo mazo: la sesión arranca sola cuando hay perfil y cartas (en
  // global arranca directa del pool del servidor). La clave replica las deps
  // del efecto original; sessionStarted queda fuera a propósito: terminar una
  // sesión no debe re-arrancarla.
  const deckAutoStartKey = deckId
    ? `${deckId}|${profileLoaded}|${allDeckCards.length}|${newCardsPerDay}`
    : null;
  const [prevAutoStartKey, setPrevAutoStartKey] = useState<string | null>(null);
  if (deckAutoStartKey !== prevAutoStartKey) {
    setPrevAutoStartKey(deckAutoStartKey);
    if (
      deckAutoStartKey &&
      profileLoaded &&
      !sessionStarted &&
      deckId === prevDeckId && // tras cambiar de mazo, primero el reset de arriba
      allDeckCards.length > 0
    ) {
      const pool = buildDuePool(allDeckCards, newCardsPerDay);
      if (pool.length > 0) {
        // pool vacío → "Todo al día"
        setSessionCards(pool);
        setSessionStarted(true);
      }
    }
  }

  const advance = useCallback(() => {
    setSessionDone((d) => d + 1);
    if (idx + 1 >= cards.length) {
      setSessionStarted(false);
      setIdx(0);
    } else {
      setIdx((i) => i + 1);
    }
    setShowAnswer(false);
  }, [idx, cards.length]);

  const rate = useCallback(
    async (rating: SrsRating) => {
      if (!card) return;
      setLastAction({ card: { ...card }, idx, wasAgain: rating === 0 });
      const prevLevel = srsToLevel(card.srsInterval, card.srsReps);
      const next = applySrs(card, rating);
      const nextLevel = srsToLevel(next.srsInterval, next.srsReps);
      if (nextLevel > prevLevel) setSessionLevelUps((n) => n + 1);
      try {
        await updateWord(card.id, next);
      } catch {
        // Sin red: el repaso se encola y se sincroniza al volver la conexión
        enqueueReview(card.id, next);
      }
      // Métrica de retención y contador diario: fire-and-forget para no sumar
      // latencia de red entre tarjeta y tarjeta (la fluidez importa aquí).
      logReview(card.id, rating).catch(() => {});
      void bumpStudyToday({ reviews: 1 });
      if (rating === 0) setSessionAgain((n) => n + 1);
      advance();
    },
    [card, idx, advance, user.id],
  );

  const undo = useCallback(async () => {
    if (!lastAction) return;
    const { card: prev, idx: prevIdx, wasAgain } = lastAction;
    try {
      await updateWord(prev.id, {
        srsInterval: prev.srsInterval,
        srsEase: prev.srsEase,
        srsReps: prev.srsReps,
        srsLapses: prev.srsLapses,
        srsDue: prev.srsDue,
        status: prev.status,
        lastReviewedAt: prev.lastReviewedAt,
      });
    } catch {
      /* noop */
    }
    setSessionCards((prevCards) => {
      const next = [...prevCards];
      next.splice(prevIdx, 0, prev);
      return next;
    });
    setIdx(prevIdx);
    setShowAnswer(true);
    setSessionDone((d) => Math.max(0, d - 1));
    if (wasAgain) setSessionAgain((n) => Math.max(0, n - 1));
    setLastAction(null);
  }, [lastAction]);

  function beginSession(pool: Word[], cram: boolean) {
    setSessionCards(pool);
    setSessionStarted(true);
    setCramMode(cram);
    setSessionLevelUps(0);
    setIdx(0);
    setShowAnswer(false);
    setSessionDone(0);
    setSessionAgain(0);
    setLastAction(null);
  }

  // El vocabulario completo solo está cargado si hizo falta; si no, se pide aquí.
  async function ensureAllCards(): Promise<Word[]> {
    if (allDeckCards.length > 0 || deckId) return allDeckCards;
    try {
      const all = (await listWords())
        .filter((w) => w.status !== "ignored")
        .sort((a, b) => a.srsDue.localeCompare(b.srsDue));
      setAllDeckCards(all);
      return all;
    } catch {
      return [];
    }
  }

  async function refetchSession() {
    // Prefer what's actually due; if nothing is due, review everything anyway.
    if (!deckId) {
      try {
        const pool = await listWordsDue(newCardsPerDay);
        if (pool.length) return beginSession(pool, false);
      } catch {
        /* fall through to local data */
      }
    }
    const all = await ensureAllCards();
    const pool = buildDuePool(all, newCardsPerDay);
    beginSession(pool.length ? pool : [...all], false);
  }

  async function startCram() {
    const all = await ensureAllCards();
    beginSession(
      [...all].sort(() => Math.random() - 0.5),
      true,
    );
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.code === "Space" && !showAnswer) {
        e.preventDefault();
        setShowAnswer(true);
        return;
      }
      if (!showAnswer) return;
      if (e.key === "1") rate(0);
      if (e.key === "2") rate(1);
      if (e.key === "3") rate(2);
      if (e.key === "4") rate(3);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAnswer, rate, undo]);

  return {
    deckId,
    deck,
    card,
    cards,
    idx,
    showAnswer,
    setShowAnswer,
    sessionStarted,
    sessionDone,
    sessionAgain,
    sessionLevelUps,
    cramMode,
    lastAction,
    reviewCount,
    newCount,
    allDeckCards,
    loading,
    rate,
    undo,
    advance,
    refetchSession,
    startCram,
  };
}
