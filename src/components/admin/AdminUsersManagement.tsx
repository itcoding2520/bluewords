"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Download, Pencil, RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { exportAdminUsersCsv } from "@/lib/admin-users-csv.mjs";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { formatShortDate } from "@/lib/formatDate";
import { PasswordInput } from "@/components/ui/PasswordInput";

type AdminUser = {
  id: string;
  email: string | null;
  nickname: string;
  created_at: string;
  last_sign_in_at: string | null;
};
type UserActionResponse = {
  error?: string;
};

function downloadCsv(name: string, contents: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdminUsersManagement() {
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
      const payload = await getAdminCachedData(cacheKey, async () => {
        const response = await fetch(`/api/admin/users?${query}`, { cache: "no-store" });
        const result = await response.json() as { users?: AdminUser[]; total?: number; error?: string };
        if (!response.ok) throw new Error(result.error ?? "Could not load users.");
        return result;
      }, { force });
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

  function showMutationResult(payload: UserActionResponse, fallback: string) {
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
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...values }),
      });
      const payload = await response.json() as UserActionResponse;
      if (!response.ok) throw new Error(payload.error ?? "Could not complete this user action.");
      showMutationResult(payload, "User saved.");
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
      const response = await fetch(`/api/admin/users?${query}`, { cache: "no-store" });
      const payload = await response.json() as { users?: AdminUser[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not export users.");
      const date = new Date();
      const suffix = `${String(date.getDate()).padStart(2, "0")}${String(date.getMonth() + 1).padStart(2, "0")}${date.getFullYear()}`;
      downloadCsv(`users_${suffix}.csv`, exportAdminUsersCsv(payload.users ?? []));
      setNotice(`Exported ${payload.users?.length ?? 0} user(s). Passwords are never included.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not export users.");
    } finally {
      setExporting(false);
    }
  }

  return <div className="admin-users-page">
    <AdminNavigation active="users" />
    <header className="admin-users-hero mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="admin-users-hero-copy"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">User management</h1><p className="page-intro-description mt-2">Search, manage, and export accounts.</p></div>
      <div className="admin-users-actions flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => { invalidateAdminDataCache(); setRefreshKey((value) => value + 1); }} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
        <Button variant="secondary" onClick={() => void exportUsers()} disabled={exporting}>{exporting ? "Exporting…" : <><Download size={16} /> Export CSV</>}</Button>
        <Button onClick={() => setShowAddForm((value) => !value)}><UserPlus size={16} /> Add user</Button>
      </div>
    </header>

    {error && <AutoDismissMessage key={error} variant="error" className="mb-4 whitespace-pre-line">{error}</AutoDismissMessage>}
    {notice && <AutoDismissMessage key={notice} variant="success" className="mb-4">{notice}</AutoDismissMessage>}

    {showAddForm && <form onSubmit={(event) => void addUser(event)} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="New user email" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={60} placeholder="Nickname (optional)" aria-label="New user nickname" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <PasswordInput required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Temporary password (8+ chars)" aria-label="New user password" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <Button type="submit" disabled={busy === "create"}>Create user</Button>
      </div>
    </form>}

    <Dialog.Root open={editingUser !== null} onOpenChange={(open) => { if (!open && !busy) setEditingUser(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Content aria-describedby="edit-user-description" className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><Dialog.Title className="text-lg font-semibold text-slate-950">Edit user</Dialog.Title><Dialog.Description id="edit-user-description" className="mt-1 text-sm text-slate-500">Update account details for {editingUser?.email}.</Dialog.Description></div>
            <Dialog.Close asChild><button type="button" aria-label="Close edit user dialog" disabled={busy !== null} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button></Dialog.Close>
          </div>
          <form onSubmit={(event) => void editUser(event)} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Email<input type="email" required value={editEmail} onChange={(event) => setEditEmail(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block text-sm font-medium text-slate-700">Nickname<input value={editNickname} maxLength={24} onChange={(event) => setEditNickname(event.target.value)} placeholder="Leave blank to clear nickname" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><span className="mt-1 block text-xs font-normal text-slate-500">Use 2–24 characters, or leave blank.</span></label>
            <label className="block text-sm font-medium text-slate-700">New password<PasswordInput minLength={8} value={editPassword} onChange={(event) => setEditPassword(event.target.value)} placeholder="Leave blank to keep current password" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters when changing.</span></label>
            <div className="flex justify-end gap-2 pt-2"><Dialog.Close asChild><Button type="button" variant="secondary" disabled={busy !== null}>Cancel</Button></Dialog.Close><Button type="submit" disabled={busy === editingUser?.id}>{busy === editingUser?.id ? "Saving…" : "Save changes"}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>

    <section className="admin-users-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="admin-users-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
        <h2 className="font-semibold text-slate-900">Users <span className="font-normal text-slate-500">({total})</span></h2>
        <label className="admin-users-search relative block w-full sm:max-w-sm"><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search by email or nickname…" aria-label="Search users" className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
      </div>

      {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading users…</p> : users.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No users match this search.</p> : <div className="admin-users-table-wrap">
        <div className="admin-users-table-head" aria-hidden="true"><span>User</span><span>Joined</span><span>Last activity</span><span /></div>
        <div className="admin-users-list">
          {users.map((user) => <article key={user.id} className="admin-users-row">
            <div className="admin-users-identity"><span className="admin-users-avatar" aria-hidden="true">{(user.nickname || user.email || "?").trim().charAt(0).toUpperCase()}</span><span className="admin-users-identity-copy"><strong>{user.email ?? "No email"}</strong><small>{user.nickname || "No nickname"}</small></span></div>
            <div className="admin-users-joined"><span className="admin-users-mobile-label">Joined</span><span>{formatShortDate(user.created_at)}</span></div>
            <div className={`admin-users-activity${user.last_sign_in_at ? " is-active" : " is-never"}`}><span className="admin-users-mobile-label">Last activity</span><span className="admin-users-activity-pill"><i aria-hidden="true" />{user.last_sign_in_at ? `Last active ${formatShortDate(user.last_sign_in_at)}` : "Never signed in"}</span></div>
            <div className="admin-users-row-actions"><ActionMenu label={user.email ?? user.nickname ?? "user"} disabled={busy === user.id} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => openEditUser(user) }, { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void removeUser(user), destructive: true }]} /></div>
          </article>)}
        </div>
      </div>}

      <footer className="admin-users-pagination flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p aria-live="polite">Showing {firstVisible}–{lastVisible} of {total} users</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2"><span className="sr-only">Rows per page</span><select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">{[10, 20, 50].map((size) => <option key={size} value={size}>{size} / page</option>)}</select></label>
          <span className="whitespace-nowrap">Page {currentPage} of {pageCount}</span>
          <Button variant="secondary" aria-label="Previous page" disabled={currentPage <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="size-9 px-0">‹</Button>
          <Button variant="secondary" aria-label="Next page" disabled={currentPage >= pageCount || loading} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="size-9 px-0">›</Button>
        </div>
      </footer>
    </section>
  </div>;
}
