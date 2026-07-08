import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Layers, Undo2, ChevronRight } from "lucide-react";
import { useFlashcardSession } from "./hooks/useFlashcardSession";
import {
  STUDY_MODES,
  STUDY_MODE_KEY,
  type StudyMode,
} from "./lib/study-modes";
import SessionComplete from "./components/SessionComplete";
import FlashCard from "./components/FlashCard";
import RatingButtons from "./components/RatingButtons";

export default function FlashcardsPage() {
  const {
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
  } = useFlashcardSession();

  const [mode, setMode] = useState<StudyMode>(() => {
    const saved = localStorage.getItem(STUDY_MODE_KEY);
    return STUDY_MODES.some((m) => m.key === saved)
      ? (saved as StudyMode)
      : "normal";
  });

  function changeMode(m: StudyMode) {
    setMode(m);
    localStorage.setItem(STUDY_MODE_KEY, m);
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="mt-6 h-72 w-full rounded-2xl" />
        <Skeleton className="mt-6 h-12 w-full rounded-xl" />
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <SessionComplete
        cramMode={cramMode}
        sessionDone={sessionDone}
        sessionAgain={sessionAgain}
        sessionLevelUps={sessionLevelUps}
        hasCards={allDeckCards.length > 0 || sessionDone > 0}
        deckId={deckId}
        onRefetch={refetchSession}
        onCram={startCram}
      />
    );
  }

  const progress = idx / cards.length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const alreadyReviewedToday =
    !!card?.lastReviewedAt && card.lastReviewedAt.slice(0, 10) === todayStr;

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-6 sm:px-6 sm:py-8">
      {deckId && deck && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4" style={{ color: deck.color }} />
          <span className="font-medium">{deck.name}</span>
          <Link
            to="/flashcards"
            viewTransition
            className="ml-auto text-xs text-muted-foreground hover:text-foreground"
          >
            Repasar todo →
          </Link>
        </div>
      )}

      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="font-medium text-foreground">
            {idx + 1} / {cards.length}
          </span>
          {cramMode && (
            <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-xs text-violet-400">
              Modo libre
            </span>
          )}
          {!cramMode && reviewCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {reviewCount} repaso
            </span>
          )}
          {!cramMode && newCount > 0 && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
              {newCount} nueva
            </span>
          )}
          {sessionLevelUps > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              ↑{sessionLevelUps} nivel
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastAction && (
            <button
              onClick={undo}
              title="Deshacer última valoración (Ctrl+Z)"
              className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Undo2 className="h-3 w-3" /> Deshacer
            </button>
          )}
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-primary" /> {sessionDone} hechas
            {sessionAgain > 0 && (
              <span className="ml-1 text-destructive">· {sessionAgain} ✗</span>
            )}
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="mt-4 flex justify-center gap-1 rounded-xl bg-muted/50 p-1">
        {STUDY_MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => changeMode(m.key)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors touch:py-2.5 ${
              mode === m.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <FlashCard
        card={card}
        showAnswer={showAnswer}
        onReveal={() => setShowAnswer(true)}
        mode={mode}
      />

      {!showAnswer ? (
        <Button
          size="lg"
          className="mt-6 gap-2"
          onClick={() => setShowAnswer(true)}
        >
          Mostrar respuesta <ChevronRight className="h-4 w-4" />
        </Button>
      ) : alreadyReviewedToday ? (
        <Button
          size="lg"
          variant="outline"
          className="mt-6 gap-2"
          onClick={advance}
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <RatingButtons card={card} onRate={rate} />
      )}
    </div>
  );
}
