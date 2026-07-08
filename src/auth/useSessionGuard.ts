import { useEffect, useState } from "react";
import { getSession } from "@/modules/auth";
import { hasToken, clearSession } from "./auth-storage";
import type { SessionUser } from "@/types";

/**
 * Bootstrapping de sesión compartido por los layouts protegidos: valida el
 * token contra /auth/session y devuelve el usuario. Con `requireRole` solo
 * deja pasar a ese rol (el token se conserva: no cumplir el rol no es lo
 * mismo que una sesión inválida).
 */
export function useSessionGuard(requireRole?: "admin") {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasToken()) {
        setIsAuthenticated(false);
        return;
      }
      try {
        const { user } = await getSession();
        if (cancelled) return;
        setUser(user);
        setIsAuthenticated(requireRole ? user?.role === requireRole : true);
      } catch {
        if (cancelled) return;
        clearSession();
        setIsAuthenticated(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requireRole]);

  return { isAuthenticated, user };
}
