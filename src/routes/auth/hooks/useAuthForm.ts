import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n";
import { login, signup } from "@/modules/auth";
import { setToken } from "@/auth/auth-storage";
import { toast } from "sonner";

export function useAuthForm() {
  const navigate = useNavigate();
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      setToken(res.token);
      toast.success(t("welcomeBack"));
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("genericError"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await signup(email, password, name);
      setToken(res.token);
      toast.success(t("accountCreated"));
      navigate("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("genericError"),
      );
    } finally {
      setLoading(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    loading,
    signIn,
    signUp,
  };
}
