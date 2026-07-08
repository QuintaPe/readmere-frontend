import { Brain, BookText, Clock, Flame, Target } from "lucide-react";
import StatCard from "@/components/StatCard";
import { useStatsData } from "./hooks/useStatsData";

// Intensidad del heatmap en 4 escalones sobre el color primario.
// Las variables del tema son colores oklch completos, de ahí color-mix.
function heatColor(total: number, max: number): string {
  if (total === 0) return "var(--muted)";
  const t = total / max;
  const pct = t < 0.25 ? 30 : t < 0.5 ? 55 : t < 0.75 ? 80 : 100;
  return `color-mix(in oklab, var(--primary) ${pct}%, transparent)`;
}

export default function StatsPage() {
  const {
    byStatus,
    total,
    totals,
    days,
    maxBar,
    activeDays,
    books,
    forecast,
    maxForecast,
    heatWeeks,
    maxHeat,
    retention,
  } = useStatsData();

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-3xl font-bold">Estadísticas</h1>
        <p className="text-muted-foreground">Últimos 30 días</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Brain} label="Repasos" value={totals.reviews} />
        <StatCard
          icon={BookText}
          label="Palabras añadidas"
          value={totals.added}
        />
        <StatCard icon={Clock} label="Minutos leyendo" value={totals.minutes} />
        <StatCard icon={Flame} label="Días activos" value={activeDays} />
      </div>

      {retention !== null && (
        <div className="card-elevated flex items-center gap-4 rounded-xl p-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{retention}%</span>
              <span className="text-sm text-muted-foreground">
                de retención (últimos 30 días)
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded bg-muted">
              <div
                className={`h-full ${retention >= 85 ? "bg-emerald-500" : retention >= 70 ? "bg-amber-500" : "bg-destructive"}`}
                style={{ width: `${retention}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {retention >= 85
                ? "Buen equilibrio: recuerdas la mayoría de lo programado."
                : retention >= 70
                  ? "Aceptable. Si baja más, revisa las palabras marcadas como difíciles."
                  : "Baja: demasiadas olvidadas. Reduce cartas nuevas por día o repasa las difíciles."}
            </p>
          </div>
        </div>
      )}

      <div className="card-elevated rounded-xl p-6">
        <h2 className="mb-4 font-semibold">Estado del vocabulario</h2>
        <div className="space-y-3">
          {(
            [
              ["new", "Nuevas", "bg-blue-500"],
              ["learning", "Aprendiendo", "bg-amber-500"],
              ["known", "Conocidas", "bg-emerald-500"],
              ["ignored", "Ignoradas", "bg-zinc-500"],
            ] as const
          ).map(([k, label, color]) => {
            const n = byStatus[k];
            const pct = Math.round((n / total) * 100);
            return (
              <div key={k}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted-foreground">
                    {n} ({pct}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-muted">
                  <div
                    className={`h-full ${color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-elevated rounded-xl p-6">
        <h2 className="mb-4 font-semibold">Actividad diaria</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((d) => {
            const t = d.reviews + d.added;
            return (
              <div
                key={d.day}
                className="group flex flex-1 flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-sm bg-primary/80"
                  style={{ height: `${(t / maxBar) * 100}%`, minHeight: "2px" }}
                  title={`${d.day}: ${t}`}
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>{days[0]?.day.slice(5)}</span>
          <span>{days[days.length - 1]?.day.slice(5)}</span>
        </div>
      </div>

      <div className="card-elevated rounded-xl p-6">
        <h2 className="mb-1 font-semibold">Próximos repasos</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {forecast[0]?.count ?? 0} cartas pendientes hoy · próximos 14 días
        </p>
        <div className="flex h-32 items-end gap-1">
          {forecast.map((f, i) => (
            <div
              key={f.day}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {f.count}
              </span>
              <div
                className={`w-full rounded-sm ${i === 0 ? "bg-primary" : "bg-primary/50"}`}
                style={{
                  height: `${(f.count / maxForecast) * 100}%`,
                  minHeight: "2px",
                }}
                title={`${f.day}: ${f.count} cartas`}
              />
              <span className="text-[9px] text-muted-foreground">
                {i === 0 ? "Hoy" : f.day.slice(8)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-elevated rounded-xl p-6">
        <h2 className="mb-4 font-semibold">Constancia · últimas 26 semanas</h2>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {heatWeeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((d) => (
                <div
                  key={d.day}
                  className="h-[11px] w-[11px] rounded-[3px]"
                  style={{ background: heatColor(d.total, maxHeat) }}
                  title={`${d.day}: ${d.total} ${d.total === 1 ? "actividad" : "actividades"}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          Menos
          {[0, 0.2, 0.45, 0.7, 1].map((t) => (
            <div
              key={t}
              className="h-[10px] w-[10px] rounded-[3px]"
              style={{ background: heatColor(t * maxHeat, maxHeat) }}
            />
          ))}
          Más
        </div>
      </div>

      {books.length > 0 && (
        <div className="card-elevated rounded-xl p-6">
          <h2 className="mb-4 font-semibold">Progreso de lectura</h2>
          <div className="space-y-3">
            {books.map((b, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate">{b.title}</span>
                  <span className="text-muted-foreground">
                    {Math.round((b.progress || 0) * 100)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${Math.round((b.progress || 0) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
