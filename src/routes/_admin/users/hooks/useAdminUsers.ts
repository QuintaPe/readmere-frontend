import { useNavigate } from "react-router-dom";
import {
  listAdminUsers,
  deleteAdminUser,
  setUserRole,
  setUserStatus,
  impersonateUser,
} from "@/modules/admin/users";
import { startImpersonation } from "@/auth/auth-storage";
import { toast } from "sonner";
import {
  useAdminList,
  withToast,
  ADMIN_PAGE_SIZE,
} from "../../hooks/useAdminList";
import type { AdminUser, PagedResponse } from "@/types";

export type { AdminUser, PagedResponse };

export const LIMIT = ADMIN_PAGE_SIZE;

export function useAdminUsers() {
  const navigate = useNavigate();
  const list = useAdminList(listAdminUsers);

  const toggleRole = ({ id, role }: { id: string; role: string }) =>
    withToast(setUserRole(id, role), "Rol actualizado", list.invalidate);

  const toggleStatus = ({ id, status }: { id: string; status: string }) =>
    withToast(setUserStatus(id, status), "Estado actualizado", list.invalidate);

  const deleteUser = (id: string) =>
    withToast(deleteAdminUser(id), "Usuario eliminado", list.invalidate);

  async function impersonate(u: AdminUser) {
    try {
      const { token } = await impersonateUser(u.id);
      startImpersonation(token);
      toast.success(`Impersonando a ${u.email}`);
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al impersonar");
    }
  }

  return { ...list, toggleRole, toggleStatus, deleteUser, impersonate };
}
