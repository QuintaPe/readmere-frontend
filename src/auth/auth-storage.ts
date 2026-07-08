import { clearQueryCache } from "@/lib/query";

// Única fuente de verdad sobre el token de sesión y la impersonación de
// admin. Nadie más debe tocar estas claves de localStorage directamente.

const TOKEN_KEY = "auth_token";
// Mientras un admin impersona a otro usuario, aquí se conserva SU token
// original para poder restaurarlo al salir.
const IMPERSONATE_KEY = "impersonate_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return getToken() !== null;
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Cierre de sesión local: tokens fuera y caché de queries vacía, para que
 * no queden datos del usuario anterior. */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IMPERSONATE_KEY);
  clearQueryCache();
}

export function isImpersonating(): boolean {
  return localStorage.getItem(IMPERSONATE_KEY) !== null;
}

/** Cambia al token del usuario impersonado conservando el del admin. */
export function startImpersonation(userToken: string) {
  const adminToken = getToken();
  if (adminToken) localStorage.setItem(IMPERSONATE_KEY, adminToken);
  setToken(userToken);
  clearQueryCache();
}

/**
 * Restaura el token del admin y sale del modo impersonación.
 * Devuelve false si no había impersonación activa.
 */
export function stopImpersonation(): boolean {
  const adminToken = localStorage.getItem(IMPERSONATE_KEY);
  if (!adminToken) return false;
  setToken(adminToken);
  localStorage.removeItem(IMPERSONATE_KEY);
  clearQueryCache();
  return true;
}
