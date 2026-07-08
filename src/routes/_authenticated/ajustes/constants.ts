import { Moon, Sun, Monitor } from "lucide-react";

export const LANGS = [
  { v: "es", label: "Español", flag: "🇪🇸" },
  { v: "en", label: "Inglés", flag: "🇬🇧" },
  { v: "fr", label: "Francés", flag: "🇫🇷" },
  { v: "de", label: "Alemán", flag: "🇩🇪" },
  { v: "it", label: "Italiano", flag: "🇮🇹" },
  { v: "pt", label: "Portugués", flag: "🇵🇹" },
  { v: "ja", label: "Japonés", flag: "🇯🇵" },
  { v: "zh", label: "Chino", flag: "🇨🇳" },
  { v: "ko", label: "Coreano", flag: "🇰🇷" },
  { v: "ru", label: "Ruso", flag: "🇷🇺" },
  { v: "ar", label: "Árabe", flag: "🇸🇦" },
] as const;

export const THEMES = [
  { v: "dark", label: "Oscuro", icon: Moon },
  { v: "light", label: "Claro", icon: Sun },
  { v: "system", label: "Sistema", icon: Monitor },
] as const;
