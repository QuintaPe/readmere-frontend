import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Volume2, Plus, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasToken } from "@/auth/auth-storage";
import { BrandLogo } from "@/components/BrandLogo";
import { Ripple } from "@/components/Ripple";

/* Fraunces display axes — soft, hand-cut character for the big type */
const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

const SAVED_WORDS = [
  { w: "ephemeral",  t: "efímero",    known: false },
  { w: "melancholy", t: "melancolía", known: true  },
  { w: "solitude",   t: "soledad",    known: false },
];

const STEPS = [
  {
    n: "01",
    title: "Abre el libro que ya querías leer",
    desc: "Sube cualquier EPUB en el idioma que estás aprendiendo. Tu novela, tu ensayo, tu cómic. Nada de frases de manual que no diría nadie.",
  },
  {
    n: "02",
    title: "Toca la palabra que se te resiste",
    desc: "La IA la traduce según la frase entera —no según el diccionario— con definición, pronunciación y un ejemplo. Sigues leyendo sin perder el hilo.",
  },
  {
    n: "03",
    title: "Repásala justo antes de olvidarla",
    desc: "Lo que guardas vuelve como flashcard en el momento en que tu memoria empezaba a soltarla. Cinco minutos al día, ordenados por el algoritmo.",
  },
];

const INSIDE = [
  {
    n: "01",
    label: "Para leer",
    title: "Un lector que no estorba",
    desc: "Sube tu EPUB y léelo con tu tipografía y tu progreso guardado. Tocas una palabra y traduces sin salir de la página.",
    meta: ["Cualquier EPUB", "Progreso sincronizado", "Pronunciación nativa"],
  },
  {
    n: "02",
    label: "Para entender",
    title: "El significado que estás leyendo",
    desc: "La misma palabra cambia según la frase. La IA lee la oración entera y te da el sentido real, no el primero del diccionario.",
    meta: ["Traducción en contexto", "Definición y ejemplo", "Función gramatical"],
  },
  {
    n: "03",
    label: "Para no olvidar",
    title: "Flashcards que eligen su momento",
    desc: "Repetición espaciada (SM-2, como Anki) integrada. Cada palabra reaparece justo cuando ibas a olvidarla. Sin montar mazos a mano.",
    meta: ["Algoritmo SM-2", "Sesiones de 5 min", "Estadísticas reales"],
  },
];

const FAQ = [
  {
    q: "¿Tengo que usar mis propios libros?",
    a: "Sí, y es lo mejor del método. Subes el EPUB que ya querías leer y aprendes con frases reales, no con ejemplos de manual que no diría nadie.",
  },
  {
    q: "¿Es gratis de verdad?",
    a: "Sí. Sin tarjeta, sin anuncios y sin límite de palabras guardadas. Creas la cuenta y empiezas a leer.",
  },
  {
    q: "¿En qué idiomas funciona?",
    a: "En cualquiera que estés leyendo. La IA traduce a tu idioma desde inglés, francés, alemán, italiano, portugués, japonés, chino y más.",
  },
  {
    q: "¿Se parece a Anki?",
    a: "El repaso usa el mismo algoritmo de repetición espaciada (SM-2), pero no montas mazos a mano: las flashcards salen solas de las palabras que guardas leyendo.",
  },
  {
    q: "¿Cómo suena la pronunciación?",
    a: "La voz del propio navegador lee la palabra en voz alta, en su idioma. Sin configurar nada y sin coste.",
  },
];

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (hasToken()) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background antialiased">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-colors duration-300 ${
          scrolled
            ? "border-b border-border/50 bg-background/80 backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrandLogo size="sm" />
          <div className="flex items-center gap-1.5">
            <Link to="/auth" viewTransition>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Iniciar sesión
              </Button>
            </Link>
            <Link to="/auth" viewTransition>
              <Button size="sm" className="rounded-full px-5">Crear cuenta</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="landing-grain relative overflow-hidden">
        <div className="landing-grid pointer-events-none absolute inset-0" />
        <div className="landing-glow pointer-events-none absolute inset-0" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
          <div className="grid items-center gap-x-12 gap-y-16 md:grid-cols-[1.05fr_0.95fr]">

            {/* ── Copy ──────────────────────────────────────────────────────── */}
            <div className="hero-stagger flex flex-col gap-7">
              <div className="flex items-center gap-3">
                <span className="text-primary">✳</span>
                <span className="eyebrow">Lector · Vocabulario · Memoria</span>
              </div>

              <h1
                className="font-serif text-[46px] font-medium leading-[1.0] tracking-tight md:text-[70px]"
                style={display}
              >
                Aprende un idioma
                <br />
                <span className="relative italic text-primary">
                  sin dejar de leer
                  <Ripple className="absolute -bottom-[0.08em] left-0 h-[0.36em] w-full overflow-visible text-primary/55" />
                </span>
                .
              </h1>

              <p className="dropcap max-w-md text-[17px] leading-relaxed text-muted-foreground">
                Los idiomas no se memorizan, se encuentran. Readmere convierte
                cualquier libro en tu método: tocas una palabra, la entiendes en
                su contexto, y vuelve a ti antes de que se te escape.
              </p>

              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                  <Link to="/auth" viewTransition>
                    <Button size="lg" className="group gap-2 rounded-full px-7 text-[15px] font-semibold">
                      Empezar a leer gratis
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                  <span className="text-[13px] text-muted-foreground/80">
                    Sin tarjeta · cuenta en 30 s
                  </span>
                </div>
              </div>

              {/* Languages — concrete, not a fabricated metric */}
              <div className="mt-3 flex items-baseline gap-4 border-t border-border/50 pt-5">
                <span className="eyebrow shrink-0">Lees en</span>
                <p className="font-serif text-[15px] italic text-foreground/70">
                  inglés · français · deutsch · 日本語 · italiano · português · 中文 …
                </p>
              </div>
            </div>

            {/* ── Reading surface — the real product, annotated in the margin ── */}
            <div className="landing-rise relative mx-auto w-full max-w-md" style={{ animationDelay: "0.22s" }}>
              {/* marginalia: the one detail that says "a person made this" */}
              <div className="landing-rise-2 pointer-events-none absolute -left-4 -top-9 z-20 hidden rotate-[-5deg] md:block lg:-left-16">
                <span className="font-serif text-[15px] italic text-primary/90">
                  lee la frase entera,
                  <br />
                  no la palabra suelta
                </span>
                <svg width="56" height="40" viewBox="0 0 56 40" fill="none" className="mt-1 text-primary/70">
                  <path d="M3 2C9 22 26 35 53 33" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="1 5" />
                  <path d="M45 28l9 5-10 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* page stacked behind, for depth without glow-blobs */}
              <div className="absolute inset-x-3 -bottom-3 top-3 -rotate-[2.2deg] rounded-2xl border border-border/40 bg-card/40" />

              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_30px_70px_-20px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)]">
                {/* page header */}
                <div className="flex items-center justify-between border-b border-border/40 px-6 pt-5 pb-3">
                  <span className="font-serif text-[13px] italic text-muted-foreground">
                    The Picture of Dorian Gray
                  </span>
                  <span className="text-[11px] tabular-nums text-muted-foreground/60">Cap. 1 · pág. 12</span>
                </div>

                {/* book text */}
                <div className="px-6 py-5">
                  <p className="font-serif text-[15px] leading-[1.85] text-foreground/80">
                    The studio was filled with the rich odour of roses, and when the
                    light summer wind stirred amidst the trees of the garden, there came
                    through the open door the heavy scent of the{" "}
                    <mark className="word-pulse relative cursor-pointer rounded-[3px] bg-primary/25 px-[3px] text-primary ring-1 ring-primary/30">
                      lilac
                      <MousePointer2 className="cursor-tap pointer-events-none absolute -bottom-3.5 -right-2.5 h-4 w-4 fill-foreground text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" />
                    </mark>
                    , or the more delicate perfume of the pink-flowering thorn.
                  </p>
                </div>

                {/* lookup card */}
                <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.06]">
                  <div className="flex items-start justify-between px-4 pt-4 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-[17px] font-semibold">lilac</span>
                        <span className="text-[12px] text-muted-foreground">/ˈlaɪlək/</span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          sustantivo
                        </span>
                      </div>
                      <p className="mt-1.5 text-[15px] font-semibold">lila — el arbusto en flor</p>
                      <p className="mt-0.5 text-[12px] italic text-muted-foreground">
                        “…the heavy scent of the lilac”
                      </p>
                    </div>
                    <button className="mt-0.5 rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 border-t border-primary/15 px-4 py-3">
                    <button className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-[12px] font-bold text-primary-foreground">
                      <Plus className="h-3.5 w-3.5" /> Guardar palabra
                    </button>
                    <button className="rounded-lg px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted">
                      Ya la sé
                    </button>
                  </div>
                </div>

                {/* vocab list */}
                <div className="border-t border-border/40 px-5 py-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                      Tu cuaderno
                    </p>
                    <span className="text-[10px] text-muted-foreground/50">3 esta sesión</span>
                  </div>
                  <div className="space-y-1.5">
                    {SAVED_WORDS.map(({ w, t, known }) => (
                      <div key={w} className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2.5">
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-serif text-[14px] font-semibold">{w}</span>
                          <span className="text-[12px] text-muted-foreground">{t}</span>
                        </div>
                        <span className={`text-[10px] font-semibold ${known ? "text-success" : "text-primary/90"}`}>
                          {known ? "✓ dominada" : "en repaso"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* reading progress — a real detail of the product */}
                <div className="h-1 w-full bg-muted/60">
                  <div className="h-full w-[34%] bg-primary/80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Philosophy epigraph ─────────────────────────────────────────────── */}
      <section className="border-y border-border/40">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-20 md:grid-cols-[auto_1fr] md:gap-12">
          <span className="eyebrow pt-3">La idea</span>
          <div>
            <p className="font-serif text-[28px] font-medium leading-[1.28] tracking-tight md:text-[40px]" style={display}>
              Nadie recuerda una palabra de una lista.
              <span className="text-muted-foreground"> Todos recuerdan </span>
              <span className="italic text-primary">dónde</span>
              <span className="text-muted-foreground"> la leyeron por primera vez.</span>
            </p>
            <p className="mt-6 text-sm text-muted-foreground">Eso es todo. El resto es ponértelo fácil.</p>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 flex items-baseline gap-4">
          <span className="font-serif text-[15px] text-primary/70" style={display}>I</span>
          <span className="eyebrow">Cómo funciona</span>
          <span className="h-px flex-1 bg-border/50" />
        </div>
        <h2 className="mb-14 max-w-2xl font-serif text-3xl font-medium tracking-tight md:text-[40px]" style={display}>
          De una página cualquiera a una palabra que ya es tuya.
        </h2>

        <div className="divide-y divide-border/40 border-y border-border/40">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="group grid gap-4 py-9 md:grid-cols-[auto_1fr] md:gap-12">
              <span className="font-serif text-4xl font-medium text-primary/70 md:text-5xl" style={display}>
                {n}
              </span>
              <div className="max-w-2xl">
                <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's inside ───────────────────────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-14 flex items-baseline gap-4">
            <span className="font-serif text-[15px] text-primary/70" style={display}>II</span>
            <span className="eyebrow">Qué hay dentro</span>
            <span className="h-px flex-1 bg-border/50" />
          </div>

          <div className="grid gap-x-12 gap-y-14 md:grid-cols-3">
            {INSIDE.map(({ n, label, title, desc, meta }) => (
              <div key={title} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[15px] text-primary/70" style={display}>{n}</span>
                  <span className="eyebrow text-primary/80">{label}</span>
                </div>
                <h3 className="mt-4 font-serif text-[23px] font-medium leading-snug tracking-tight" style={display}>
                  {title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{desc}</p>
                <p className="mt-5 border-t border-border/40 pt-4 text-[12.5px] leading-relaxed text-foreground/55">
                  {meta.join("  ·  ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="mb-14 flex items-baseline gap-4">
            <span className="font-serif text-[15px] text-primary/70" style={display}>III</span>
            <span className="eyebrow">Antes de empezar</span>
            <span className="h-px flex-1 bg-border/50" />
          </div>
          <div className="divide-y divide-border/40 border-y border-border/40">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="grid gap-2 py-7 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
                <h3 className="font-serif text-[19px] font-medium tracking-tight" style={display}>
                  {q}
                </h3>
                <p className="max-w-xl text-[15px] leading-relaxed text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA — editorial closing spread ────────────────────────────── */}
      <section className="border-t border-border/40 bg-background">
        <div className="mx-auto max-w-5xl px-6 py-28">
          <div className="mb-11 text-[17px] text-primary/55">✳</div>

          <div className="grid gap-x-14 gap-y-9 md:grid-cols-[1.15fr_0.85fr] md:items-end">
            <h2 className="font-serif text-[40px] font-medium leading-[1.0] tracking-tight md:text-[60px]" style={display}>
              Tu próximo idioma está en el próximo libro que abras.
            </h2>

            <div className="flex flex-col items-start gap-6 md:pb-2">
              <p className="max-w-sm text-[16px] leading-relaxed text-muted-foreground">
                Empieza con uno que ya tengas ganas de leer. De la primera palabra
                que guardes, te acordarás de dónde salió.
              </p>

              <Link to="/auth" viewTransition>
                <Button size="lg" className="group gap-2 rounded-full px-9 text-base font-semibold">
                  Empezar a leer gratis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>

              <div className="flex flex-col gap-2 text-[13px]">
                <span className="text-muted-foreground/70">Sin tarjeta · sin anuncios · sin límite de palabras</span>
                <span className="text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <Link to="/auth" viewTransition className="font-medium text-primary underline-offset-4 hover:underline">
                    Inicia sesión
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-[13px] text-muted-foreground sm:flex-row">
          <BrandLogo size="sm" />
          <span className="text-muted-foreground/70">Para quien aprende leyendo, no repitiendo.</span>
          <Link to="/auth" viewTransition className="flex items-center gap-1 font-medium text-primary hover:underline">
            Empezar <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </footer>

    </div>
  );
}
