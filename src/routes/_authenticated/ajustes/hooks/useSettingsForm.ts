import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { useAuth } from "@/auth/auth-context";
import { clearSession } from "@/auth/auth-storage";
import { getProfile, updateProfile } from "@/modules/profiles";
import { AI_PROVIDERS } from "@/lib/ai.functions";
import { applyTheme, getStoredTheme, type ThemeChoice } from "@/lib/theme";
import { toast } from "sonner";

// Lee la configuración de IA guardada, migrando desde el formato antiguo de
// dos claves (groq_api_key / gemini_api_key) si aún no se ha re-guardado.
function initialAiConfig(): { provider: string; key: string } {
  const provider = localStorage.getItem("ai_provider");
  const key = localStorage.getItem("ai_api_key");
  if (provider && key && AI_PROVIDERS.some((p) => p.id === provider))
    return { provider, key };
  const groq = localStorage.getItem("groq_api_key");
  if (groq) return { provider: "groq", key: groq };
  const gemini = localStorage.getItem("gemini_api_key");
  if (gemini) return { provider: "gemini", key: gemini };
  return { provider: "groq", key: "" };
}

export function useSettingsForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation("settings");

  const [displayName, setDisplayName] = useState("");
  const [nativeLang, setNativeLang] = useState("es");
  const [targetLang, setTargetLang] = useState("en");
  const [dailyGoal, setDailyGoal] = useState(20);
  const [newCardsPerDay, setNewCardsPerDay] = useState(10);
  // El tema arranca de la preferencia local ya aplicada (fuente de verdad para
  // el cambio instantáneo); el perfil solo lo sincroniza entre dispositivos.
  const [theme, setTheme] = useState<ThemeChoice>(() => getStoredTheme());

  // Aplica el tema al instante (sin recargar) y actualiza el estado del selector.
  function changeTheme(next: ThemeChoice) {
    setTheme(next);
    applyTheme(next);
  }
  const [aiProvider, setAiProvider] = useState(() => initialAiConfig().provider);
  const [aiApiKey, setAiApiKey] = useState(() => initialAiConfig().key);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProfile().then((profile) => {
      if (!profile) return;
      setDisplayName(profile.displayName ?? "");
      setNativeLang(profile.nativeLanguage ?? "es");
      setTargetLang(profile.targetLanguage ?? "en");
      setDailyGoal(profile.dailyGoal ?? 20);
      setNewCardsPerDay(profile.newCardsPerDay ?? 10);
      // Sincroniza el tema guardado en el perfil (útil al abrir en otro
      // dispositivo); aplica al instante para reflejarlo sin recargar.
      if (profile.theme) {
        setTheme(profile.theme as ThemeChoice);
        applyTheme(profile.theme as ThemeChoice);
      }
    }).catch(() => {});
  }, [user.id]);

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim() || null,
        nativeLanguage: nativeLang,
        targetLanguage: targetLang,
        dailyGoal,
        newCardsPerDay,
        theme,
      });
      localStorage.setItem("ai_provider", aiProvider);
      localStorage.setItem("ai_api_key", aiApiKey.trim());
      // Claves del formato antiguo: ya migradas al par provider+key.
      localStorage.removeItem("groq_api_key");
      localStorage.removeItem("gemini_api_key");
      toast.success(t("saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearSession();
    navigate("/auth");
  }

  const initials = user?.email
    ? user.email.split("@")[0].slice(0, 2).toUpperCase()
    : "U";

  return {
    user,
    initials,
    displayName,
    setDisplayName,
    nativeLang,
    setNativeLang,
    targetLang,
    setTargetLang,
    dailyGoal,
    setDailyGoal,
    newCardsPerDay,
    setNewCardsPerDay,
    theme,
    setTheme: changeTheme,
    aiProvider,
    setAiProvider,
    aiApiKey,
    setAiApiKey,
    saving,
    save,
    logout,
  };
}
