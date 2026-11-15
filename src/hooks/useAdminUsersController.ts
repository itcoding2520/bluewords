import { useState } from "react";
import { exportAdminUsersCsv } from "@/lib/admin-users-csv.mjs";
import { downloadCsvFile } from "@/lib/download-csv";
import { fetchAdminUsers } from "@/lib/admin-user-api";
import { useAdminUsersActions } from "@/hooks/useAdminUsersActions";
import { useAdminUsersData } from "@/hooks/useAdminUsersData";

export function useAdminUsersController() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const { users, total, loading, error, setError, debouncedSearch, refreshUsers } = useAdminUsersData({
    page,
    setPage,
    pageSize,
    search,
  });
  const actions = useAdminUsersActions({ setPage, setError, refreshUsers });
  const [exporting, setExporting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstVisible = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, total);

  async function exportUsers() {
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams({ page: "1", pageSize: "100", all: "true" });
      if (debouncedSearch) query.set("search", debouncedSearch);
      const payload = await fetchAdminUsers(query, "Could not export users.");
      const date = new Date();
      const suffix = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
      downloadCsvFile(`users_${suffix}.csv`, exportAdminUsersCsv(payload.users ?? []), {
        appendLinkToDocument: true,
        revokeAfterMs: 1000,
      });
      actions.setNotice(`Exported ${payload.users?.length ?? 0} user(s). Passwords are never included.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export users.");
    } finally {
      setExporting(false);
    }
  }

  return {
    users, total, page, setPage, pageSize, setPageSize, search, setSearch,
    loading, error, exporting, pageCount, currentPage,
    firstVisible, lastVisible,
    exportUsers, refreshUsers,
    ...actions,
  };
}
