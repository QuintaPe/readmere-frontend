import {
  Navigate,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AdminAuthContext } from "@/auth/auth-context";
import { useSessionGuard } from "@/auth/useSessionGuard";
import { clearSession } from "@/auth/auth-storage";
import {
  LayoutDashboard,
  Users,
  LogOut,
  ShieldCheck,
  BookOpen,
  Library,
  Layers,
  Brain,
} from "lucide-react";

const navItems = [
  { title: "Panel", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Usuarios", url: "/admin/users", icon: Users },
  { title: "Libros", url: "/admin/books", icon: Library },
  { title: "Mazos", url: "/admin/decks", icon: Layers },
  { title: "Vocabulario", url: "/admin/words", icon: Brain },
];

function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  function signOut() {
    clearSession();
    navigate("/auth", { replace: true });
  }

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r border-border bg-background min-h-screen">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-destructive text-destructive-foreground shadow-sm">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight">Admin</span>
          <span className="text-[10px] text-muted-foreground">Readmere</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.url
            : pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              viewTransition
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-1">
        <Link
          to="/dashboard"
          viewTransition
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          Ir a la App
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default function AdminRoute() {
  const { isAuthenticated, user } = useSessionGuard("admin");

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AdminAuthContext.Provider value={{ user }}>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-12 items-center border-b border-border bg-background/60 px-4 backdrop-blur">
            <span className="text-sm text-muted-foreground font-medium">
              Panel de Administración
            </span>
          </header>
          <main className="app-main flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </AdminAuthContext.Provider>
  );
}
