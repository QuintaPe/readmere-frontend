import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation, UI_LANGUAGES } from "@/i18n";

/**
 * Selector del idioma de la INTERFAZ. Al cambiarlo, i18next actualiza toda la
 * app al vuelo y el detector persiste la preferencia en localStorage (`ui_lang`),
 * de modo que se recuerda en la próxima visita. No confundir con el par de
 * idiomas de estudio (nativo / que estudias) del perfil.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? UI_LANGUAGES[0].code;

  return (
    <Select
      value={current}
      onValueChange={(code) => {
        void i18n.changeLanguage(code);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {UI_LANGUAGES.map((l) => (
          <SelectItem key={l.code} value={l.code}>
            {l.flag} {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
