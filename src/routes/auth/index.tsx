import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Trans, useTranslation } from "@/i18n";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasToken } from "@/auth/auth-storage";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuthForm } from "./hooks/useAuthForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* Fraunces display axes — same character as the landing */
const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

const Wordmark = () => <BrandLogo size="md" to="/" />;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function Field({ id, label, icon: Icon, ...props }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input id={id} className="h-11 pl-10" {...props} />
      </div>
    </div>
  );
}

function PasswordField({ id, autoComplete, value, onChange }: {
  id: string;
  autoComplete: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useTranslation("auth");
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{t("fields.password")}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          className="h-11 px-10"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={6}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((s) => !s)}
          aria-label={show ? t("hidePassword") : t("showPassword")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { t } = useTranslation("auth");
  const authenticated = hasToken();
  const {
    email, setEmail, password, setPassword, name, setName, loading, signIn, signUp,
  } = useAuthForm();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  if (authenticated) return <Navigate to="/dashboard" replace />;

  const heading =
    tab === "signin"
      ? { title: t("signInHeading"), sub: t("signInSub") }
      : { title: t("signUpHeading"), sub: t("signUpSub") };

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[1.05fr_1fr]">

      {/* ── Brand panel ─────────────────────────────────────────────────────── */}
      <aside className="relative hidden overflow-hidden border-r border-border/40 bg-gradient-to-br from-card/50 via-background to-background md:flex md:flex-col md:justify-between md:p-14">
        <div className="landing-grid pointer-events-none absolute inset-0 opacity-50" />

        <div className="relative z-10">
          <Wordmark />
        </div>

        <div className="relative z-10 max-w-md">
          <span aria-hidden className="block font-serif text-[96px] leading-[0.4] text-primary/20" style={display}>
            “
          </span>
          <p className="mt-4 font-serif text-[31px] font-medium leading-[1.25] tracking-tight" style={display}>
            <Trans
              t={t}
              i18nKey="brandPromoQuote"
              components={{
                muted: <span className="text-muted-foreground" />,
                em: <span className="italic text-primary" />,
              }}
            />
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            {t("brandPromoAttribution", { appName: "Readmere" })}
          </p>
        </div>

        <p className="relative z-10 text-[12px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {t("brandFeatures")}
        </p>
      </aside>

      {/* ── Form ────────────────────────────────────────────────────────────── */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="landing-rise w-full max-w-sm">
          <div className="mb-10 md:hidden">
            <Wordmark />
          </div>

          <h1 className="font-serif text-[32px] font-medium leading-tight tracking-tight" style={display}>
            {heading.title}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">{heading.sub}</p>

          <Button
            type="button"
            variant="outline"
            className="mt-8 flex h-11 w-full items-center gap-2.5"
            onClick={() => { window.location.href = `${API_BASE}/api/auth/google`; }}
          >
            <GoogleIcon />
            {t("continueWithGoogle")}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-[0.18em]">
              <span className="bg-background px-3 text-muted-foreground">{t("orWithEmail")}</span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("tabSignIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("tabSignUp")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <form onSubmit={signIn} className="space-y-4">
                <Field id="e1" label={t("fields.email")} icon={Mail} type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <PasswordField id="p1" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" disabled={loading} className="h-11 w-full font-semibold">
                  {loading ? t("signInButtonLoading") : t("signInButton")}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={signUp} className="space-y-4">
                <Field id="n2" label={t("fields.name")} icon={User} autoComplete="name" placeholder={t("fields.namePlaceholder")}
                  value={name} onChange={(e) => setName(e.target.value)} />
                <Field id="e2" label={t("fields.email")} icon={Mail} type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
                <PasswordField id="p2" autoComplete="new-password"
                  value={password} onChange={(e) => setPassword(e.target.value)} />
                <Button type="submit" disabled={loading} className="h-11 w-full font-semibold">
                  {loading ? t("signUpButtonLoading") : t("signUpButton")}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-[12px] text-muted-foreground/70">
            {t("footerPerks")}
            <Link to="/" viewTransition className="underline-offset-4 hover:text-foreground hover:underline">
              {t("backToHome")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
