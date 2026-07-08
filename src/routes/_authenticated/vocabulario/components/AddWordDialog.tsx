import { useState } from "react";
import { createWord } from "@/modules/words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { translateWord } from "@/lib/ai.functions";
import { toast } from "sonner";

interface AddWordDialogProps {
  onDone: () => void;
}

export default function AddWordDialog({ onDone }: AddWordDialogProps) {
  const [term, setTerm] = useState("");
  const [translation, setTranslation] = useState("");
  const [definition, setDefinition] = useState("");
  const [example, setExample] = useState("");
  const [language, setLanguage] = useState("en");
  const [lemma, setLemma] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(false);

  async function fillWithAi() {
    if (!term.trim()) return toast.error("Escribe una palabra primero");
    setLoadingAi(true);
    try {
      const result = await translateWord({
        data: {
          term: term.trim(),
          sourceLanguage: language,
          targetLanguage: "es",
        },
      });
      if (result.translation) setTranslation(result.translation);
      if (result.definition) setDefinition(result.definition);
      if (result.example) setExample(result.example);
      if (result.lemma && result.lemma !== term.trim()) setLemma(result.lemma);
      if (result.difficulty) setDifficulty(result.difficulty);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error con la IA");
    } finally {
      setLoadingAi(false);
    }
  }

  async function save() {
    if (!term.trim()) return;
    setLoading(true);
    try {
      await createWord({
        term: term.trim(),
        translation: translation.trim() || null,
        definition: definition.trim() || null,
        example: example.trim() || null,
        language,
        source: "manual",
        lemma: lemma.trim() || null,
        difficulty: difficulty || null,
      });
      toast.success("Palabra añadida");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Añadir palabra</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Palabra *</Label>
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && fillWithAi()}
            />
          </div>
          <div>
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="fr">FR</SelectItem>
                <SelectItem value="de">DE</SelectItem>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="ja">JA</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          onClick={fillWithAi}
          disabled={loadingAi || !term.trim()}
        >
          {loadingAi ? (
            <>
              <X className="h-3.5 w-3.5 animate-spin" /> Buscando...
            </>
          ) : (
            "✨ Rellenar con IA"
          )}
        </Button>
        <div>
          <Label>Traducción</Label>
          <Input
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Forma base</Label>
            <Input
              value={lemma}
              onChange={(e) => setLemma(e.target.value)}
              placeholder="ej: run"
            />
          </div>
          <div>
            <Label>Nivel CEFR</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Definición</Label>
          <Textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Label>Ejemplo</Label>
          <Textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            rows={2}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={loading || !term.trim()}>
          Guardar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
