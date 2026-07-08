import {
  getToken,
  hasToken,
  clearSession,
  stopImpersonation,
} from "@/auth/auth-storage";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Sesión caducada o cuenta suspendida a mitad de uso: limpiar y volver a
// /auth una sola vez, en vez de dejar que cada acción falle con toasts sueltos.
// Los endpoints /auth/* se excluyen (un login fallido también responde 401).
function handleSessionExpired() {
  if (stopImpersonation()) {
    // El token de impersonación murió: vuelta al panel con la sesión del admin.
    window.location.href = "/admin/users";
    return;
  }
  clearSession();
  if (window.location.pathname !== "/auth") {
    window.location.href = "/auth";
  }
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}${endpoint}`;

  // For FormData, we don't set Content-Type so the browser can set the boundary
  const isFormData = options.body instanceof FormData;
  const headers = getAuthHeaders();
  if (isFormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (
      response.status === 401 &&
      !endpoint.startsWith("/auth/") &&
      hasToken()
    ) {
      handleSessionExpired();
    }
    throw new Error(errorData.error || `API error: ${response.status}`);
  }

  return response.json();
}
