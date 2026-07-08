import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Save, LogOut, KeyRound, Bot } from "lucide-react";
import { AI_PROVIDERS } from "@/lib/ai.functions";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LANGS, THEMES } from "./constants";
import SettingRow from "./components/SettingRow";
import SettingSection from "./components/SettingSection";
import { useSettingsForm } from "./hooks/useSettingsForm";

export default function SettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const {
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
    setTheme,
    aiProvider,
    setAiProvider,
    aiApiKey,
    setAiApiKey,
    saving,
    save,
    logout,
  } = useSettingsForm();

  const selectedProvider =
    AI_PROVIDERS.find((p) => p.id === aiProvider) ?? AI_PROVIDERS[0];

  // Estado de la IA según lo que hay en el formulario (que refleja
  // localStorage) o las claves por defecto del build.
  const aiConfigured = Boolean(
    aiApiKey ||
      import.meta.env.VITE_GROQ_API_KEY ||
      import.meta.env.VITE_GEMINI_API_KEY,
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <div className="flex items-center gap-4 pb-2">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/20 text-xl font-bold text-primary">
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">
            {displayName || user.email.split("@")[0]}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      <SettingSection title={t("settings:sections.account")}>
        <div className="px-4">
          <SettingRow label={t("settings:name")} hint={t("settings:nameHint")}>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("settings:namePlaceholder")}
              className="h-8 text-sm"
            />
          </SettingRow>
        </div>
      </SettingSection>

      <SettingSection title={t("settings:sections.languages")}>
        <div className="px-4">
          <SettingRow
            label={t("settings:interfaceLanguage")}
            hint={t("settings:interfaceLanguageHint")}
          >
            <LanguageSwitcher className="h-8 text-sm" />
          </SettingRow>
          <SettingRow label={t("settings:nativeLanguage")}>
            <Select value={nativeLang} onValueChange={setNativeLang}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.v} value={l.v}>
                    {l.flag} {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label={t("settings:targetLanguage")}>
            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGS.map((l) => (
                  <SelectItem key={l.v} value={l.v}>
                    {l.flag} {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </div>
      </SettingSection>

      <SettingSection title={t("settings:sections.study")}>
        <div className="px-4">
          <SettingRow label={t("settings:dailyGoal")} hint={t("settings:dailyGoalHint")}>
            <div className="space-y-1.5">
              <Slider
                min={5}
                max={200}
                step={5}
                value={[dailyGoal]}
                onValueChange={([v]) => setDailyGoal(v)}
              />
              <p className="text-right text-xs font-semibold text-primary">
                {t("settings:dailyGoalValue", { count: dailyGoal })}
              </p>
            </div>
          </SettingRow>
          <SettingRow
            label={t("settings:newCardsPerDay")}
            hint={t("settings:newCardsPerDayHint")}
          >
            <div className="space-y-1.5">
              <Slider
                min={1}
                max={50}
                step={1}
                value={[newCardsPerDay]}
                onValueChange={([v]) => setNewCardsPerDay(v)}
              />
              <p className="text-right text-xs font-semibold text-primary">
                {t("settings:newCardsPerDayValue", { count: newCardsPerDay })}
              </p>
            </div>
          </SettingRow>
        </div>
      </SettingSection>

      <SettingSection title={t("settings:sections.appearance")}>
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {THEMES.map(({ v, icon: Icon }) => (
              <button
                key={v}
                onClick={() => setTheme(v)}
                className={`flex flex-col items-center gap-1.5 rounded-lg border py-3 text-xs font-medium transition-all ${
                  theme === v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/50 text-muted-foreground hover:bg-muted/30"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`settings:theme.${v}`)}
              </button>
            ))}
          </div>
        </div>
      </SettingSection>

      <SettingSection title={t("settings:sections.ai")}>
        <div className="px-4 py-4 space-y-4">
          {/* Estado actual, bien visible: sin clave la app pierde su función
              principal (traducir al tocar) y el usuario debe saberlo aquí. */}
          {aiConfigured ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t("settings:ai.activeBadge")}
            </div>
          ) : (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              <p className="font-semibold">{t("settings:ai.missingTitle")}</p>
              <p className="mt-0.5">{t("settings:ai.missingBody")}</p>
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("settings:ai.explanation")}
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm font-medium">{t("settings:ai.service")}</p>
            </div>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                    {p.note && (
                      <span className="ml-1.5 text-xs text-muted-foreground">
                        — {p.note}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {t("settings:ai.apiKeyLabel", { provider: selectedProvider.label })}
                </p>
              </div>
              <a
                href={selectedProvider.keyUrl}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                {t("settings:ai.getKey")}
              </a>
            </div>
            <Input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder={selectedProvider.placeholder}
              className="text-sm"
            />
          </div>
        </div>
      </SettingSection>

      <div className="space-y-2 pt-1">
        <Button
          onClick={save}
          disabled={saving}
          className="w-full gap-2"
          size="lg"
        >
          <Save className="h-4 w-4" />
          {saving ? t("settings:saving") : t("settings:saveChanges")}
        </Button>
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-muted-foreground transition hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          {t("settings:signOut")}
        </button>
      </div>
    </div>
  );
}
