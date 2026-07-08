import { useState, useEffect } from "react";
import { getAdminStats, getAdminTimeline } from "@/modules/admin/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Brain, Layers } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface AdminStats {
  users: number;
  books: number;
  words: number;
  decks: number;
}
interface TimelinePoint {
  day: string;
  count: number;
}
interface Timeline {
  newUsers: TimelinePoint[];
  newWords: TimelinePoint[];
  newBooks: TimelinePoint[];
}

function mergeTimeline(timeline: Timeline) {
  const map: Record<
    string,
    { day: string; usuarios: number; palabras: number; libros: number }
  > = {};
  const addPoints = (
    pts: TimelinePoint[],
    key: "usuarios" | "palabras" | "libros",
  ) => {
    pts.forEach((p) => {
      if (!map[p.day])
        map[p.day] = { day: p.day, usuarios: 0, palabras: 0, libros: 0 };
      map[p.day][key] = Number(p.count);
    });
  };
  addPoints(timeline.newUsers, "usuarios");
  addPoints(timeline.newWords, "palabras");
  addPoints(timeline.newBooks, "libros");
  return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
}

export default function AdminIndexPage() {
  const [stats, setStats] = useState<AdminStats | undefined>();
  const [timeline, setTimeline] = useState<Timeline | undefined>();

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
    getAdminTimeline().then(setTimeline).catch(() => {});
  }, []);

  const chartData = timeline ? mergeTimeline(timeline) : [];

  const cards = [
    { label: "Usuarios", value: stats?.users, icon: Users },
    { label: "Libros", value: stats?.books, icon: BookOpen },
    { label: "Palabras", value: stats?.words, icon: Brain },
    { label: "Mazos", value: stats?.decks, icon: Layers },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estadísticas globales de la plataforma
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad últimos 30 días</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin datos suficientes
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={chartData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="usuarios" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="palabras" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="libros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(d) => d.slice(5)}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(d) => `Día: ${d}`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="usuarios"
                  stroke="#6366f1"
                  fill="url(#usuarios)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="palabras"
                  stroke="#10b981"
                  fill="url(#palabras)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="libros"
                  stroke="#f59e0b"
                  fill="url(#libros)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
