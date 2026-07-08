import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "@/auth/auth-storage";
import { toast } from "sonner";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // El backend manda el token en el fragment (#token=...) para que no toque
    // logs de servidor ni historial compartible; se acepta también en query
    // por compatibilidad con redirects antiguos.
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const params = new URLSearchParams(window.location.search);
    const token = hash.get("token") || params.get("token");
    const error = params.get("error");

    if (token) {
      setToken(token);
      toast.success("¡Bienvenido!");
      navigate("/dashboard", { replace: true });
    } else {
      toast.error(
        error === "google"
          ? "Error al autenticar con Google"
          : "Error de autenticación",
      );
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Autenticando...</p>
    </div>
  );
}
