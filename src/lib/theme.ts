/**
 * Gestión del tema de la app (claro / oscuro / sistema).
 *
 * Fuente de verdad: localStorage `theme` (una de ThemeChoice). El backend
 * (`profiles.theme`) solo persiste la preferencia entre dispositivos; el
 * cambio instantáneo y el anti-parpadeo (FOUC) los lleva el cliente:
 *
 *  - Un script inline en index.html aplica la clase `.dark` ANTES del primer
 *    paint leyendo esta misma clave (ver STORAGE_KEY). Mantener ambos en sync.
 *  - applyTheme() togglea `.dark` en <html> y fija `color-scheme` para que los
 *    controles nativos, la barra de scroll y el `<meta theme-color>` sigan el tema.
 *  - En modo "system" escuchamos `prefers-color-scheme` y re-aplicamos en vivo.
 *
 * Añadir un tema nuevo en el futuro = añadir sus tokens en index.css y, si no
 * es un simple claro/oscuro, ampliar `resolveTheme`. La UI no necesita cambios.
 */

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const STORAGE_KEY = "theme";
const VALID: readonly ThemeChoice[] = ["light", "dark", "system"];

// Default: oscuro. Preserva la identidad actual para usuarios existentes
// (la app era dark-only); el usuario puede pasar a claro/sistema en Ajustes.
export const DEFAULT_THEME: ThemeChoice = "dark";

function systemMedia(): MediaQueryList | null {
  return typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
}

export function systemPrefersDark(): boolean {
  return systemMedia()?.matches ?? false;
}

export function getStoredTheme(): ThemeChoice {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as ThemeChoice | null;
    if (raw && VALID.includes(raw)) return raw;
  } catch {
    /* localStorage no disponible (SSR / modo privado) */
  }
  return DEFAULT_THEME;
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  if (choice === "system") return systemPrefersDark() ? "dark" : "light";
  return choice;
}

// Suscriptores que quieren enterarse del tema efectivo (p. ej. el Toaster).
type Listener = (resolved: ResolvedTheme) => void;
const listeners = new Set<Listener>();

export function subscribeTheme(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Aplica el tema al DOM (clase + color-scheme) y notifica a los suscriptores. */
function paint(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  listeners.forEach((fn) => fn(resolved));
}

/** Persiste la elección, la aplica al instante y activa/desactiva el listener de sistema. */
export function applyTheme(choice: ThemeChoice): ResolvedTheme {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* noop */
  }
  bindSystemListener(choice === "system");
  const resolved = resolveTheme(choice);
  paint(resolved);
  return resolved;
}

let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;
function bindSystemListener(enable: boolean) {
  const mql = systemMedia();
  if (!mql) return;
  if (mediaHandler) {
    mql.removeEventListener("change", mediaHandler);
    mediaHandler = null;
  }
  if (enable) {
    mediaHandler = (e) => paint(e.matches ? "dark" : "light");
    mql.addEventListener("change", mediaHandler);
  }
}

/** Llamar una vez al arrancar la app: reconcilia el DOM con la preferencia guardada. */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
