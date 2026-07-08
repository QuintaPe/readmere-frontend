import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { refreshTokenIfNeeded } from "@/modules/auth";
import { AuthContext } from "@/auth/auth-context";
import { useSessionGuard } from "@/auth/useSessionGuard";
import { isImpersonating, stopImpersonation } from "@/auth/auth-storage";
import { startReviewQueueSync } from "@/lib/review-queue";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import GlobalSearch from "@/components/GlobalSearch";
import { ShieldCheck } from "lucide-react";

function ImpersonationBanner() {
  const navigate = useNavigate();
  if (!isImpersonating()) return null;

  function exitImpersonation() {
    stopImpersonation();
    navigate("/admin/users", { replace: true });
    window.location.reload();
  }

  return (
    <div className="flex items-center justify-between bg-amber-500/20 border-b border-amber-500/40 px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" />
        Estás impersonando a un usuario como administrador
      </div>
      <button
        onClick={exitImpersonation}
        className="font-semibold underline hover:no-underline"
      >
        Volver al admin
      </button>
    </div>
  );
}

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useSessionGuard();

  useEffect(() => {
    if (!isAuthenticated) return;
    // Sincroniza repasos hechos offline en sesiones anteriores
    startReviewQueueSync();
    // Renueva el JWT si está cerca de caducar
    void refreshTokenIfNeeded();
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AuthContext.Provider value={{ user }}>
      <ImpersonationBanner />
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-12 items-center gap-2 border-b border-border bg-background/60 px-3 backdrop-blur">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">Readmere</span>
              <GlobalSearch />
            </header>
            <main className="app-main min-w-0 flex-1">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthContext.Provider>
  );
}
