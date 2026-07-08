import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createDeck } from "@/modules/decks";
import { toast } from "sonner";
import { COLORS } from "../constants";

interface NewDeckDialogProps {
  onDone: () => void;
}

export default function NewDeckDialog({ onDone }: NewDeckDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(COLORS[0]);
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createDeck({ name: name.trim(), description: description.trim() || null, color });
      toast.success("Mazo creado");
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo mazo</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div>
          <Label>Color</Label>
          <div className="mt-2 flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-8 w-8 rounded-full transition-all ${color === c ? "ring-2 ring-offset-2 ring-offset-background ring-foreground" : ""}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={loading}>
          Crear
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
