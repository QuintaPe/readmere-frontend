import { useNavigate } from "react-router-dom";
import { X, Plus, Volume2, BookmarkPlus, BookOpen, Bookmark, Settings } from "lucide-react";
import { speak } from "@/lib/speech";
import type { Lookup, ReaderThemeColors } from "@/types/reader";

interface WordLookupPopupProps {
  theme: ReaderThemeColors;
  lookup: Lookup;
  bookLanguage: string;
  onClose: () => void;
  onSave: () => void;
  onAddBookmark: () => void;
  raised?: boolean;
}

export default function WordLookupPopup({
  theme: t,
  lookup,
  bookLanguage,
  onClose,
  onSave,
  onAddBookmark,
  raised = false,
}: WordLookupPopupProps) {
  const navigate = useNavigate();
  return (
    <div
      className={`popup-rise absolute left-1/2 z-40 w-[min(520px,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl shadow-2xl ${
        raised ? "bottom-28" : "bottom-4"
      }`}
      style={{
        background: t.bg,
        border: `1px solid ${t.text}18`,
        color: t.text,
      }}
    >
      {/* Header */}
      <div
        className="flex items-start justify-between gap-3 px-5 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${t.text}10` }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-serif text-[26px] font-semibold tracking-tight"
              style={{ fontVariationSettings: '"opsz" 72, "SOFT" 30' }}
            >
              {lookup.term}
            </span>
            {!lookup.loading && lookup.difficulty && (
              <span
                className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                style={{ borderColor: `${t.text}20`, color: `${t.text}60` }}
              >
                {lookup.difficulty}
              </span>
            )}
          </div>
          {!lookup.loading && (lookup.phonetic || lookup.partOfSpeech) && (
            <div className="mt-1 flex items-center gap-2">
              {lookup.phonetic && (
                <span className="text-sm" style={{ color: `${t.text}55` }}>
                  {lookup.phonetic}
                </span>
              )}
              {lookup.partOfSpeech && (
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: `${t.link}20`, color: t.link }}
                >
                  {lookup.partOfSpeech}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => speak(lookup.term, bookLanguage)}
            className="rounded-full p-2 transition-opacity hover:opacity-70 touch:p-3"
            style={{ background: `${t.link}18`, color: t.link }}
            title="Escuchar pronunciación"
          >
            <Volume2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-opacity hover:opacity-70 touch:p-3"
            style={{ background: `${t.text}10`, color: t.text }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {lookup.missingAi ? (
          // Sin clave de IA no hay traducción posible: explicarlo aquí, en el
          // momento exacto en que el usuario lo nota, y llevarle a Ajustes.
          <div className="space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: `${t.text}85` }}>
              Para traducir palabras necesitas una clave de IA
              (Groq o Gemini, <strong>ambas gratuitas</strong>). Se configura
              una sola vez y se guarda solo en tu navegador.
            </p>
            <button
              onClick={() => navigate("/ajustes", { viewTransition: true })}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: t.link, color: t.selText }}
            >
              <Settings className="h-4 w-4" /> Configurar IA en Ajustes
            </button>
          </div>
        ) : lookup.loading ? (
          <div className="space-y-3 py-1">
            <div className="h-6 w-2/5 animate-pulse rounded-md" style={{ background: `${t.text}24` }} />
            <div className="h-3.5 w-full animate-pulse rounded" style={{ background: `${t.text}12` }} />
            <div className="h-3.5 w-11/12 animate-pulse rounded" style={{ background: `${t.text}12` }} />
            <div className="h-3.5 w-3/5 animate-pulse rounded" style={{ background: `${t.text}12` }} />
          </div>
        ) : (
          <div className="space-y-3">
            {lookup.translation && (
              <p className="text-xl font-semibold" style={{ color: t.link }}>
                {lookup.translation}
              </p>
            )}
            {lookup.lemma && lookup.lemma !== lookup.term && (
              <p className="text-xs" style={{ color: `${t.text}50` }}>
                forma base:{" "}
                <span className="font-medium" style={{ color: `${t.text}80` }}>
                  {lookup.lemma}
                </span>
              </p>
            )}
            {lookup.definition && (
              <p
                className="text-sm leading-relaxed"
                style={{ color: `${t.text}75` }}
              >
                {lookup.definition}
              </p>
            )}
            {lookup.example && (
              <p
                className="border-l-2 pl-3 text-sm italic"
                style={{ borderColor: `${t.link}40`, color: `${t.text}55` }}
              >
                "{lookup.example}"
              </p>
            )}
            {lookup.synonyms && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lookup.synonyms
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((s) => (
                    <span
                      key={s}
                      className="rounded-lg px-2.5 py-1 text-xs"
                      style={{
                        background: `${t.text}0e`,
                        color: `${t.text}80`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {!lookup.loading && !lookup.missingAi && (
        <div className="px-5 pb-5 flex items-center gap-2">
          {lookup.bookmarkNote !== undefined ? (
            <div
              className="flex-1 rounded-xl py-2.5 px-4 text-sm flex items-center gap-2"
              style={{ background: `${t.link}15`, color: t.link }}
            >
              <Bookmark className="h-4 w-4 shrink-0" />
              <span className="truncate">{lookup.bookmarkNote || "Marcador sin nota"}</span>
            </div>
          ) : lookup.alreadySaved ? (
            <div
              className="flex-1 rounded-xl py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: `${t.link}15`, color: t.link }}
            >
              <BookOpen className="h-4 w-4" /> Ya en vocabulario
            </div>
          ) : (
            <button
              onClick={onSave}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-85"
              style={{ background: t.link, color: t.selText }}
            >
              <Plus className="h-4 w-4" /> Guardar en vocabulario
            </button>
          )}
          {!lookup.bookmarkNote && (
            <button
              onClick={onAddBookmark}
              title="Añadir marcador"
              className="rounded-xl px-3 py-2.5 flex items-center justify-center transition-opacity hover:opacity-85"
              style={{ background: `${t.text}14`, color: t.text }}
            >
              <BookmarkPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
