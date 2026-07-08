import { useState } from "react";
import { updateWord } from "@/modules/words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Volume2, Pencil, Check, Eye, EyeOff, Trash2, Bug } from "lucide-react";
import { srsToLevel, levelColor, isLeech } from "@/lib/srs";
import { speak } from "@/lib/speech";
import { toast } from "sonner";
import type { Word } from "@/types";

function srsDueLabel(due: string): { label: string; urgent: boolean } {
  const d = new Date(due);
  const now = new Date();
  const diff = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return { label: "Hoy", urgent: true };
  if (diff === 1) return { label: "Mañana", urgent: false };
  if (diff < 7) return { label: `${diff}d`, urgent: false };
  return {
    label: d.toLocaleDateString("es", { day: "numeric", month: "short" }),
    urgent: false,
  };
}

type EditDraft = Partial<
  Pick<
    Word,
    | "translation"
    | "definition"
    | "example"
    | "phonetic"
    | "partOfSpeech"
    | "synonyms"
    | "lemma"
    | "difficulty"
  >
>;

interface WordDetailSheetProps {
  word: Word | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onToggleIgnore: (id: string, currentStatus: string) => void;
  onSaved: (updated: Word) => void;
}

export default function WordDetailSheet({
  word: detailWord,
  onClose,
  onDelete,
  onToggleIgnore,
  onSaved,
}: WordDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft>({});

  async function saveEdit() {
    if (!detailWord) return;
    try {
      await updateWord(detailWord.id, editDraft);
      const updated = { ...detailWord, ...editDraft };
      setEditing(false);
      onSaved(updated);
      toast.success("Guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    }
  }

  function startEdit() {
    setEditing(true);
    setEditDraft({
      translation: detailWord?.translation ?? "",
      definition: detailWord?.definition ?? "",
      example: detailWord?.example ?? "",
      phonetic: detailWord?.phonetic ?? "",
      partOfSpeech: detailWord?.partOfSpeech ?? "",
      synonyms: detailWord?.synonyms ?? "",
      lemma: detailWord?.lemma ?? "",
      difficulty: detailWord?.difficulty ?? "",
    });
  }

  return (
    <Sheet
      open={!!detailWord}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setEditing(false);
        }
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {detailWord &&
          (() => {
            const level = srsToLevel(
              detailWord.srsInterval,
              detailWord.srsReps,
            );
            const color =
              detailWord.status === "ignored" ? "#6b7280" : levelColor(level);
            const due = srsDueLabel(detailWord.srsDue);
            return (
              <>
                <div className="flex items-start justify-between gap-3 p-6 pb-4">
                  <div className="flex-1 min-w-0">
                    <SheetTitle className="text-3xl font-bold leading-tight">
                      {detailWord.term}
                    </SheetTitle>
                    {detailWord.phonetic && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {detailWord.phonetic}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {detailWord.partOfSpeech && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {detailWord.partOfSpeech}
                        </span>
                      )}
                      {detailWord.difficulty && (
                        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {detailWord.difficulty}
                        </span>
                      )}
                      {detailWord.lemma &&
                        detailWord.lemma !== detailWord.term && (
                          <span className="text-xs text-muted-foreground">
                            base:{" "}
                            <span className="font-medium text-foreground">
                              {detailWord.lemma}
                            </span>
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center justify-between self-stretch">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          speak(detailWord.term, detailWord.language || "en")
                        }
                        className="rounded-full bg-primary/10 p-2.5 text-primary transition-opacity hover:opacity-70"
                      >
                        <Volume2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={startEdit}
                        className="rounded-full bg-muted p-2.5 text-muted-foreground transition-opacity hover:opacity-70"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white"
                      style={{ background: color }}
                    >
                      {detailWord.status === "ignored" ? "â€“" : level}
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border mx-6" />

                {editing ? (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {(
                      [
                        {
                          label: "Traducción",
                          key: "translation",
                          multiline: false,
                        },
                        {
                          label: "Fonética",
                          key: "phonetic",
                          multiline: false,
                        },
                        {
                          label: "Categoría gramatical",
                          key: "partOfSpeech",
                          multiline: false,
                        },
                        {
                          label: "Forma base",
                          key: "lemma",
                          multiline: false,
                        },
                        {
                          label: "Nivel CEFR",
                          key: "difficulty",
                          multiline: false,
                        },
                        {
                          label: "Definición",
                          key: "definition",
                          multiline: true,
                        },
                        { label: "Ejemplo", key: "example", multiline: true },
                        {
                          label: "Sinónimos",
                          key: "synonyms",
                          multiline: false,
                        },
                      ] as {
                        label: string;
                        key: keyof EditDraft;
                        multiline: boolean;
                      }[]
                    ).map(({ label, key, multiline }) => (
                      <div key={key}>
                        <Label className="text-xs text-muted-foreground">
                          {label}
                        </Label>
                        {multiline ? (
                          <Textarea
                            className="mt-1"
                            rows={2}
                            value={editDraft[key] ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <Input
                            className="mt-1"
                            value={editDraft[key] ?? ""}
                            onChange={(e) =>
                              setEditDraft((d) => ({
                                ...d,
                                [key]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-6 space-y-7">
                    {detailWord.translation && (
                      <p className="text-2xl font-semibold text-primary">
                        {detailWord.translation}
                      </p>
                    )}
                    {detailWord.definition && (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {detailWord.definition}
                      </p>
                    )}
                    {detailWord.example && (
                      <blockquote className="border-l-2 border-primary/30 pl-4 text-sm italic text-muted-foreground">
                        "{detailWord.example}"
                      </blockquote>
                    )}
                    {detailWord.synonyms && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Sinónimos
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {detailWord.synonyms
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .map((s) => (
                              <span
                                key={s}
                                className="rounded-lg bg-muted px-2.5 py-1 text-sm"
                              >
                                {s}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                    {isLeech(detailWord) && detailWord.status !== "ignored" && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-sm">
                        <Bug className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <p className="leading-relaxed text-muted-foreground">
                          Esta palabra se te resiste ({detailWord.srsLapses}{" "}
                          fallos). Prueba a editar la traducción o el ejemplo
                          para hacerla más memorable, o ignórala por un tiempo.
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Repaso espaciado
                      </p>
                      {(
                        [
                          [
                            "Próximo repaso",
                            detailWord.status === "ignored"
                              ? "Ignorada"
                              : due.label,
                            due.urgent && detailWord.status !== "ignored",
                          ],
                          ["Repasos", String(detailWord.srsReps ?? 0), false],
                          ["Fallos", String(detailWord.srsLapses ?? 0), false],
                          [
                            "Nivel SRS",
                            detailWord.status === "ignored"
                              ? "Ignorada"
                              : `${level} / 10`,
                            false,
                          ],
                          ...(detailWord.source
                            ? [["Fuente", detailWord.source, false]]
                            : []),
                        ] as [string, string, boolean][]
                      ).map(([label, value, highlight]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted-foreground">{label}</span>
                          <span
                            className={
                              highlight
                                ? "font-medium text-primary"
                                : "capitalize"
                            }
                          >
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 border-t p-6">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button className="flex-1 gap-2" onClick={saveEdit}>
                        <Check className="h-4 w-4" /> Guardar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={() =>
                          onToggleIgnore(detailWord.id, detailWord.status)
                        }
                      >
                        {detailWord.status === "ignored" ? (
                          <>
                            <Eye className="h-4 w-4" /> Activar
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4" /> Ignorar
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(detailWord.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </>
            );
          })()}
      </SheetContent>
    </Sheet>
  );
}
