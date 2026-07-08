interface Last7ChartProps {
  data: Array<{ day: string; reviews: number; wordsAdded: number }>;
}

const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

// Snapshot de los últimos 7 días anclado a "ahora". Fuera del componente:
// leer el reloj durante el render viola las reglas de pureza de React.
function buildLast7Days(data: Last7ChartProps["data"]) {
  const days: Array<{ date: string; label: string; total: number; reviews: number; added: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const s = data.find((x) => x.day === dateStr);
    days.push({
      date: dateStr,
      label: DAY_LABELS[d.getDay()],
      total: (s?.reviews ?? 0) + (s?.wordsAdded ?? 0),
      reviews: s?.reviews ?? 0,
      added: s?.wordsAdded ?? 0,
    });
  }
  return days;
}

export default function Last7Chart({ data }: Last7ChartProps) {
  const days = buildLast7Days(data);
  const max = Math.max(1, ...days.map((d) => d.total));
  // El bucle va de hace 6 días a hoy: la última entrada ES hoy.
  const todayStr = days[days.length - 1].date;

  return (
    <div className="flex h-36 items-end gap-1.5">
      {days.map((d) => {
        const isToday = d.date === todayStr;
        const heightPct = Math.max(4, (d.total / max) * 100);
        return (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center gap-1.5">
            {/* Tooltip */}
            {d.total > 0 && (
              <div className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                <div className="whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[10px] shadow-md">
                  <span className="font-semibold">{d.total}</span>
                  <span className="text-muted-foreground"> acciones</span>
                </div>
                <div className="h-1.5 w-px bg-border" />
              </div>
            )}
            <div
              className={`w-full rounded-md transition-all duration-500 ${
                isToday ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/50"
              }`}
              style={{ height: `${heightPct}%` }}
            />
            <span className={`text-[10px] ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
