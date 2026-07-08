export const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "secondary",
  learning: "default",
  known: "outline",
  ignored: "secondary",
};

export const STATUS_LABELS: Record<string, string> = {
  new: "Nueva",
  learning: "Aprendiendo",
  known: "Conocida",
  ignored: "Ignorada",
};
