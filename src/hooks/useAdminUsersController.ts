import { useState } from "react";
import { useAdminUsersActions } from "@/hooks/useAdminUsersActions";
import { useAdminUsersData } from "@/hooks/useAdminUsersData";
import { useAdminUsersExport } from "@/hooks/useAdminUsersExport";
import { getPageMetadata } from "@/lib/pagination";

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

  const pageMetadata = getPageMetadata(total, page, pageSize);

  return {
    users, total, page, setPage, pageSize, setPageSize, search, setSearch,
    loading, error, exporting,
    pageCount: pageMetadata.pageCount,
    currentPage: pageMetadata.currentPage,
    firstVisible: pageMetadata.first, lastVisible: pageMetadata.last,
    exportUsers, refreshUsers,
    ...actions,
  };
}
