import { useState } from "react";
import { useAdminUsersActions } from "@/hooks/useAdminUsersActions";
import { useAdminUsersData } from "@/hooks/useAdminUsersData";
import { useAdminUsersExport } from "@/hooks/useAdminUsersExport";
import { getNextPage, getPageMetadata, getPreviousPage } from "@/lib/pagination";

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

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changePageSize(value: number) {
    setPageSize(value);
    setPage(1);
  }

  return {
    directory: {
      users,
      total,
      loading,
      error,
      search,
      pageSize,
      pageCount: pageMetadata.pageCount,
      currentPage: pageMetadata.currentPage,
      firstVisible: pageMetadata.first,
      lastVisible: pageMetadata.last,
      changeSearch,
      changePageSize,
      previousPage: () => setPage((value) => getPreviousPage(value)),
      nextPage: () => setPage((value) => getNextPage(value, pageMetadata.pageCount)),
      refresh: refreshUsers,
    },
    addForm: {
      email: actions.email,
      setEmail: actions.setEmail,
      nickname: actions.nickname,
      setNickname: actions.setNickname,
      password: actions.password,
      setPassword: actions.setPassword,
      isOpen: actions.showAddForm,
      setIsOpen: actions.setShowAddForm,
      submit: actions.addUser,
    },
    editForm: {
      user: actions.editingUser,
      setUser: actions.setEditingUser,
      email: actions.editEmail,
      setEmail: actions.setEditEmail,
      nickname: actions.editNickname,
      setNickname: actions.setEditNickname,
      password: actions.editPassword,
      setPassword: actions.setEditPassword,
      submit: actions.editUser,
    },
    actions: {
      busy: actions.busy,
      notice: actions.notice,
      openEditUser: actions.openEditUser,
      removeUser: actions.removeUser,
    },
    export: {
      isExporting: exporting,
      run: exportUsers,
    },
  };
}
