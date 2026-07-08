import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminUserDetail } from "@/modules/admin/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Layers,
  Calendar,
  Flame,
} from "lucide-react";

interface UserDetail {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  displayName: string | null;
  targetLanguage: string | null;
  nativeLanguage: string | null;
  dailyGoal: number;
  streakCurrent: number;
  streakLongest: number;
  booksCount: number;
  wordsCount: number;
  decksCount: number;
  wordsByStatus: { status: string; count: number }[];
  recentSessions: {
    day: string;
    reviews: number;
    wordsAdded: number;
    readingMinutes: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  new: "#6366f1",
  learning: "#f59e0b",
  known: "#10b981",
  ignored: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  new: "Nuevas",
  learning: "Aprendiendo",
  known: "Conocidas",
  ignored: "Ignoradas",
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Si se navega de un usuario a otro sin desmontar, volver al estado de
  // carga (ajuste durante el render, no setState síncrono en el efecto).
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setUser(undefined);
    setIsLoading(true);
  }

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getAdminUserDetail(id)
      .then((data) => {
        if (!cancelled) setUser(data as unknown as UserDetail);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading)
    return <div className="p-6 text-sm text-muted-foreground">Cargando...</div>;
  if (!user)
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Usuario no encontrado
      </div>
    );

  const totalWords = user.wordsByStatus.reduce(
    (s, w) => s + Number(w.count),
    0,
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" asChild>
          <Link to="/admin/users" viewTransition>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {user.displayName || user.email}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
            {user.role}
          </Badge>
          <Badge
            variant={user.status === "suspended" ? "destructive" : "outline"}
          >
            {user.status === "suspended" ? "Suspendido" : "Activo"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Libros", value: user.booksCount, icon: BookOpen },
          { label: "Palabras", value: user.wordsCount, icon: Brain },
          { label: "Mazos", value: user.decksCount, icon: Layers },
          { label: "Racha actual", value: user.streakCurrent, icon: Flame },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-1 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Idioma objetivo", user.targetLanguage?.toUpperCase()],
              ["Idioma nativo", user.nativeLanguage?.toUpperCase()],
              ["Meta diaria", `${user.dailyGoal} palabras`],
              ["Racha más larga", `${user.streakLongest} días`],
              [
                "Miembro desde",
                new Date(user.createdAt).toLocaleDateString("es-ES"),
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vocabulario por estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalWords === 0 ? (
              <p className="text-sm text-muted-foreground">Sin palabras</p>
            ) : (
              user.wordsByStatus.map((ws) => {
                const pct =
                  totalWords > 0
                    ? Math.round((Number(ws.count) / totalWords) * 100)
                    : 0;
                return (
                  <div key={ws.status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{STATUS_LABELS[ws.status] || ws.status}</span>
                      <span className="text-muted-foreground">
                        {ws.count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor:
                            STATUS_COLORS[ws.status] || "#6b7280",
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Sesiones recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin sesiones registradas
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-left">
                  <th className="pb-2 font-medium">Día</th>
                  <th className="pb-2 font-medium">Repasos</th>
                  <th className="pb-2 font-medium">Palabras añadidas</th>
                  <th className="pb-2 font-medium">Minutos lectura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {user.recentSessions.map((s) => (
                  <tr key={s.day}>
                    <td className="py-2 pr-4">{s.day}</td>
                    <td className="py-2 pr-4">{s.reviews}</td>
                    <td className="py-2 pr-4">{s.wordsAdded}</td>
                    <td className="py-2">{s.readingMinutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
