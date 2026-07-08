import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Flame, Target, BookText, Brain, Library,
  ArrowRight, TrendingUp, Zap,
} from "lucide-react";
import Last7Chart from "./components/Last7Chart";
import { useDashboardData } from "./hooks/useDashboardData";
import { useAuth } from "@/auth/auth-context";

export default function Dashboard() {
  const { data, goal, todayDone, goalPct } = useDashboardData();
  const { user } = useAuth();

  const firstName = (data?.profile?.displayName || user?.email || "").split(/[\s@]/)[0];

  const hour = new Date().getHours();
  const greeting = hour < 13 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">

      {/* ── Greeting ──────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {firstName ? `${firstName} 👋` : "¡Bienvenido!"}
          </h1>
        </div>
        {data?.profile?.streakCurrent ? (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="font-semibold">{data.profile.streakCurrent}</span>
            <span className="text-muted-foreground">días seguidos</span>
          </div>
        ) : null}
      </div>

      {/* ── Meta del día ──────────────────────────────────────────────────── */}
      <div className="card-elevated rounded-xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Meta diaria</span>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {todayDone} <span className="text-muted-foreground font-normal">/ {goal}</span>
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${goalPct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {goalPct >= 100
            ? "¡Meta completada hoy! 🎉"
            : `${goal - todayDone} acciones más para completar tu meta`}
        </p>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Para repasar
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">
            {data?.dueCount ?? 0}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">tarjetas pendientes</p>
        </div>

        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Vocabulario
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10">
              <BookText className="h-3.5 w-3.5 text-violet-400" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">
            {data?.totalWords ?? 0}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">palabras guardadas</p>
        </div>

        <div className="card-elevated rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Racha récord
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-3.5 w-3.5 text-orange-400" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-bold tabular-nums">
            {data?.profile?.streakLongest ?? 0}
            <span className="ml-1 text-base font-normal text-muted-foreground">d</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">mejor racha conseguida</p>
        </div>
      </div>

      {/* ── Chart + Acciones ──────────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="card-elevated rounded-xl p-6 md:col-span-3">
          <div className="mb-5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Actividad — últimos 7 días</h2>
          </div>
          <Last7Chart data={data?.last7 ?? []} />
        </div>

        <div className="card-elevated rounded-xl p-6 md:col-span-2">
          <div className="mb-5 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Acciones rápidas</h2>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/flashcards" viewTransition>
              <Button className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Repasar
                  {(data?.dueCount ?? 0) > 0 && (
                    <span className="rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                      {data!.dueCount}
                    </span>
                  )}
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
            <Link to="/lector" viewTransition>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  Biblioteca
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
            <Link to="/vocabulario" viewTransition>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BookText className="h-4 w-4" />
                  Vocabulario
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Continuar leyendo ─────────────────────────────────────────────── */}
      {data?.books && data.books.length > 0 && (
        <div className="card-elevated rounded-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Continuar leyendo</h2>
            </div>
            <Link to="/lector" viewTransition>
              <Button variant="ghost" size="sm" className="gap-1 text-xs text-muted-foreground">
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data.books.map((b) => {
              const pct = Math.round((b.progress || 0) * 100);
              return (
                <Link
                  key={b.id}
                  to={`/lector/${b.id}`}
                  viewTransition
                  className="group flex flex-col gap-2 rounded-lg border border-border bg-background/40 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{b.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.author || "Sin autor"}</p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
