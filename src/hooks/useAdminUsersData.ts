import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { fetchAdminUsers, type AdminUserRecord } from "@/lib/admin-user-api";
import { getPageCount } from "@/lib/pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useAdminUsersData({
  page,
  setPage,
  pageSize,
  search,
}: {
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  pageSize: number;
  search: string;
}) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 250);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadUsers = useCallback(async (signal?: AbortSignal, force = false) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (debouncedSearch) query.set("search", debouncedSearch);
      const cacheKey = `admin:users:${page}:${pageSize}:${debouncedSearch}`;
      const payload = await getAdminCachedData(
        cacheKey,
        () => fetchAdminUsers(query),
        { force }
      );
      if (signal?.aborted) return;
      const nextTotal = payload.total ?? 0;
      const nextPageCount = getPageCount(nextTotal, pageSize);
      setTotal(nextTotal);
      if (page > nextPageCount) {
        setPage(nextPageCount);
        return;
      }
      setUsers(payload.users ?? []);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      if (signal?.aborted) return;
      setError(cause instanceof Error ? cause.message : "Could not load users.");
      setUsers([]);
      setTotal(0);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [debouncedSearch, page, pageSize, setPage]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadUsers(controller.signal, refreshKey > 0); }, 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [loadUsers, refreshKey]);

  const refreshUsers = useCallback(() => {
    invalidateAdminDataCache();
    setRefreshKey((value) => value + 1);
  }, []);

  return { users, total, loading, error, setError, debouncedSearch, refreshUsers };
}
