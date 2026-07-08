import { useState, useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { srsToLevel, levelColor } from "@/lib/srs";
import {
  clozeSentence,
  normalizeAnswer,
  effectiveMode,
  type StudyMode,
} from "../lib/study-modes";
import type { Word } from "@/types";

interface FlashCardProps {
  card: Word;
  showAnswer: boolean;
  onReveal: () => void;
  mode: StudyMode;
}

export default function FlashCard({
  card,
  showAnswer,
  onReveal,
  mode: requestedMode,
}: FlashCardProps) {
  const mode = effectiveMode(card, requestedMode);
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Tarjeta o modo nuevos → limpiar lo escrito. Ajuste durante el render
  // (patrón documentado de React), no setState síncrono en un efecto.
  const resetKey = `${card.id}|${mode}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setTyped("");
    setSubmitted("");
  }

  // El foco sí es un efecto: toca el DOM.
  useEffect(() => {
    if (mode === "typing") inputRef.current?.focus();
  }, [card.id, mode]);

  const lv = srsToLevel(card.srsInterval, card.srsReps);
  const color = levelColor(lv);
  const levelLabel =
    lv === 1
      ? "Nueva"
      : lv <= 3
        ? "Iniciando"
        : lv <= 6
          ? "Aprendiendo"
          : lv <= 9
            ? "Casi dominada"
            : "Dominada";

  const typedCorrect =
    normalizeAnswer(submitted) === normalizeAnswer(card.term);

  function submitTyped() {
    setSubmitted(typed);
    inputRef.current?.blur();
    onReveal();
  }

  const cloze = card.example ? clozeSentence(card.example, card.term) : null;

  // Cara frontal según el modo
  const front =
    mode === "normal" ? (
      <>
        <div className="text-4xl font-semibold">{card.term}</div>
        {card.language && (
          <div className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
            {card.language}
          </div>
        )}
      </>
    ) : mode === "cloze" ? (
      <>
        <div className="text-xl leading-relaxed italic">"{cloze}"</div>
        {card.translation && (
          <div className="mt-3 text-sm text-muted-foreground">
            pista: {card.translation}
          </div>
        )}
      </>
    ) : (
      // reverse y typing muestran la traducción como pregunta
      <>
        <div className="text-4xl font-semibold">{card.translation}</div>
        {card.partOfSpeech && (
          <div className="mt-1 text-xs text-muted-foreground">
            {card.partOfSpeech}
          </div>
        )}
      </>
    );

  // Cara trasera: en clásico la respuesta es la traducción; en el resto, el término
  const back =
    mode === "normal" ? (
      <>
        <div className="text-2xl text-primary">{card.translation || "—"}</div>
        {card.definition && (
          <div className="text-sm text-muted-foreground">{card.definition}</div>
        )}
        {card.example && (
          <div className="mt-2 text-sm italic text-muted-foreground">
            "{card.example}"
          </div>
        )}
      </>
    ) : (
      <>
        {mode === "typing" && (
          <div
            className={`mx-auto flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
              typedCorrect
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {typedCorrect ? (
              <>
                <Check className="h-4 w-4" /> ¡Correcto!
              </>
            ) : (
              <>
                <X className="h-4 w-4" /> Escribiste: {submitted || "(nada)"}
              </>
            )}
          </div>
        )}
        <div className="text-2xl font-semibold text-primary">{card.term}</div>
        {card.phonetic && (
          <div className="text-sm text-muted-foreground">{card.phonetic}</div>
        )}
        {card.definition && (
          <div className="text-sm text-muted-foreground">{card.definition}</div>
        )}
        {card.example && (
          <div className="mt-2 text-sm italic text-muted-foreground">
            "{card.example}"
          </div>
        )}
      </>
    );

  return (
    <div
      className="card-elevated mt-6 flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-2xl p-10 text-center transition-all"
      onClick={() => !showAnswer && mode !== "typing" && onReveal()}
    >
      <div className="mb-4 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: color }}
        >
          {lv}
        </div>
        <span className="text-xs text-muted-foreground">{levelLabel}</span>
      </div>

      {front}

      {showAnswer ? (
        <div className="mt-6 w-full space-y-2 border-t border-border pt-6">
          {back}
        </div>
      ) : mode === "typing" ? (
        <div
          className="mt-6 flex w-full max-w-xs items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitTyped();
            }}
            placeholder="Escribe la palabra…"
            className="h-11 flex-1 rounded-xl border border-border bg-background px-4 text-center text-base outline-none focus:border-primary"
            autoFocus
          />
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-1 text-sm text-muted-foreground">
          Pulsa{" "}
          <kbd className="mx-1 rounded border border-border bg-muted px-1.5 py-0.5 text-xs">
            espacio
          </kbd>{" "}
          para ver
        </div>
      )}
    </div>
  );
}
