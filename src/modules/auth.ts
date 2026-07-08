import { fetchApi } from "@/lib/api";
import { getToken, setToken, isImpersonating } from "@/auth/auth-storage";
import type { SessionUser } from "@/types";

export function login(
  email: string,
  password: string,
): Promise<{ token: string }> {
  return fetchApi("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signup(
  email: string,
  password: string,
  displayName: string,
): Promise<{ token: string }> {
  return fetchApi("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName }),
  });
}

export function getSession(): Promise<{ user: SessionUser }> {
  return fetchApi("/auth/session");
}

// Días de vida que le quedan al JWT guardado (null si no hay o no se puede leer).
function tokenDaysLeft(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (typeof payload.exp !== "number") return null;
    return (payload.exp * 1000 - Date.now()) / 86400000;
  } catch {
    return null;
  }
}

/**
 * Renueva el token si le quedan menos de 3 días. Llamar al arrancar la app
 * autenticada: una cuenta que se usa a diario nunca llega a caducar, y una
 * abandonada expira sola a los 7 días.
 */
export async function refreshTokenIfNeeded(): Promise<void> {
  const daysLeft = tokenDaysLeft();
  if (daysLeft === null || daysLeft > 3) return;
  // No pisar el token del admin mientras impersona a otro usuario
  if (isImpersonating()) return;
  try {
    const { token } = await fetchApi("/auth/refresh", { method: "POST" });
    if (token) setToken(token);
  } catch {
    // Sin red o token ya inválido: getSession decidirá si expulsa al usuario
  }
}
