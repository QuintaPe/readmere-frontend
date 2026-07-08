import { fetchApi } from "@/lib/api";
import type { AdminUser, PagedResponse } from "@/types";

export function listAdminUsers(
  page: number,
  limit: number,
  search: string,
): Promise<PagedResponse<AdminUser>> {
  return fetchApi(
    `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
  );
}

export function createAdminUser(data: {
  email: string;
  password: string;
  displayName?: string;
  role: string;
}): Promise<AdminUser> {
  return fetchApi("/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteAdminUser(id: string): Promise<void> {
  return fetchApi(`/admin/users/${id}`, { method: "DELETE" });
}

export function setUserRole(id: string, role: string): Promise<void> {
  return fetchApi(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function setUserStatus(id: string, status: string): Promise<void> {
  return fetchApi(`/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function impersonateUser(id: string): Promise<{ token: string }> {
  return fetchApi(`/admin/users/${id}/impersonate`, { method: "POST" });
}

export function getAdminUserDetail(id: string): Promise<AdminUser> {
  return fetchApi(`/admin/users/${id}`);
}
