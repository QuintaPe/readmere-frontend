import { createContext, useContext } from "react";
import type { SessionUser } from "@/types";

// Los contexts viven aquí (no en los layouts de ruta) para que hooks y
// componentes compartidos no dependan del árbol de rutas.

export const AuthContext = createContext<{ user: SessionUser } | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within ProtectedRoute");
  return context;
}

export const AdminAuthContext = createContext<{ user: SessionUser } | null>(
  null,
);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminRoute");
  return context;
}
