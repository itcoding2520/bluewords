import { useState } from "react";
import { useAdminUsersActions } from "@/hooks/useAdminUsersActions";
import { useAdminUsersData } from "@/hooks/useAdminUsersData";
import { useAdminUsersExport } from "@/hooks/useAdminUsersExport";
import { getPageCount } from "@/lib/pagination";

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
  const { exporting, exportUsers } = useAdminUsersExport({
    search: debouncedSearch,
    setError,
    setNotice: actions.setNotice,
  });

  const pageCount = getPageCount(total, pageSize);
  const currentPage = Math.min(page, pageCount);
  const firstVisible = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, total);

  return {
    users, total, page, setPage, pageSize, setPageSize, search, setSearch,
    loading, error, exporting, pageCount, currentPage,
    firstVisible, lastVisible,
    exportUsers, refreshUsers,
    ...actions,
  };
}
