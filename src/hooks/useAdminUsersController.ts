import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { exportAdminUsersCsv } from "@/lib/admin-users-csv.mjs";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { downloadCsvFile } from "@/lib/download-csv";
import { fetchAdminUsers, sendAdminUserAction, type AdminUserRecord } from "@/lib/admin-user-api";

export type AdminUser = AdminUserRecord;

export function useAdminUsersController() {
  const confirmDialog = useConfirmDialog();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [exporting, setExporting] = useState(false);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstVisible = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastVisible = Math.min(currentPage * pageSize, total);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

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
      const nextPageCount = Math.max(1, Math.ceil(nextTotal / pageSize));
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
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void loadUsers(controller.signal, refreshKey > 0); }, 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [loadUsers, refreshKey]);

  function showMutationResult(payload: { error?: string }, fallback: string) {
    if (payload.error) {
      setError(payload.error);
      setNotice("");
    } else {
      invalidateAdminDataCache();
      setError("");
      setNotice(fallback);
      setRefreshKey((value) => value + 1);
    }
  }

  async function performUserAction(action: string, values: Record<string, string>) {
    setBusy(values.userId ?? action);
    setError("");
    setNotice("");
    try {
      const payload = await sendAdminUserAction(action, values);
      showMutationResult(payload, action === "delete" ? "User removed." : action === "create" ? "User created." : "User saved.");
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not complete this user action.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await performUserAction("create", { email: email.trim(), nickname: nickname.trim(), password })) {
      setEmail("");
      setNickname("");
      setPassword("");
      setShowAddForm(false);
      setPage(1);
    }
  }

  function openEditUser(user: AdminUser) {
    setEditingUser(user);
    setEditEmail(user.email ?? "");
    setEditNickname(user.nickname);
    setEditPassword("");
    setError("");
    setNotice("");
  }

  async function editUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    const values: Record<string, string> = {
      userId: editingUser.id,
      email: editEmail.trim(),
      nickname: editNickname.trim(),
    };
    if (editPassword) values.password = editPassword;
    if (await performUserAction("update", values)) {
      setEditingUser(null);
      setEditPassword("");
    }
  }

  async function removeUser(user: AdminUser) {
    const confirmed = await confirmDialog({ title: "Remove user?", description: `Remove ${user.email ?? user.id}? This permanently deletes their account, vocabulary, and history.`, confirmLabel: "Remove" });
    if (!confirmed) return;
    await performUserAction("delete", { userId: user.id });
  }

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
      setNotice(`Exported ${payload.users?.length ?? 0} user(s). Passwords are never included.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export users.");
    } finally {
      setExporting(false);
    }
  }

  function refreshUsers() {
    invalidateAdminDataCache();
    setRefreshKey((value) => value + 1);
  }

  return {
    users, total, page, setPage, pageSize, setPageSize, search, setSearch,
    loading, busy, error, notice, email, setEmail, nickname, setNickname,
    password, setPassword, showAddForm, setShowAddForm, editingUser,
    setEditingUser, editEmail, setEditEmail, editNickname, setEditNickname,
    editPassword, setEditPassword, exporting, pageCount, currentPage,
    firstVisible, lastVisible, addUser, editUser, openEditUser, removeUser,
    exportUsers, refreshUsers,
  };
}
