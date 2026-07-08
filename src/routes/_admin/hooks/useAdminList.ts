import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { PagedResponse } from "@/types";

export const ADMIN_PAGE_SIZE = 20;

/**
 * Estado compartido de las tablas paginadas del admin: búsqueda (que resetea
 * la página), paginación y recarga tras una mutación (`invalidate`).
 */
export function useAdminList<T>(
  fetcher: (
    page: number,
    limit: number,
    search: string,
  ) => Promise<PagedResponse<T>>,
) {
  const [search, setSearchState] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResponse<T> | undefined>();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    fetcher(page, ADMIN_PAGE_SIZE, search)
      .then(setData)
      .catch(() => {});
  }, [fetcher, page, search, version]);

  return {
    rows: data?.data ?? [],
    total: data?.total ?? 0,
    search,
    page,
    setSearch: (v: string) => {
      setSearchState(v);
      setPage(1);
    },
    setPage,
    invalidate: () => setVersion((v) => v + 1),
  };
}

/** Mutación de admin estándar: recarga la lista y avisa con un toast. */
export async function withToast(
  action: Promise<unknown>,
  successMsg: string,
  onSuccess?: () => void,
) {
  try {
    await action;
    onSuccess?.();
    toast.success(successMsg);
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Error");
  }
}
