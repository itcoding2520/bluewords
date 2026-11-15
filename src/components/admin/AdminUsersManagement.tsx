"use client";

import { Download, Pencil, RefreshCw, Search, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { formatShortDate } from "@/lib/formatDate";
import { useAdminUsersController } from "@/hooks/useAdminUsersController";
import { AdminAddUserForm, AdminEditUserDialog } from "@/components/admin/AdminUserForms";

export function AdminUsersManagement() {
  const {
    users, total, setPage, pageSize, setPageSize, search, setSearch,
    loading, busy, error, notice, email, setEmail, nickname, setNickname,
    password, setPassword, showAddForm, setShowAddForm, editingUser,
    setEditingUser, editEmail, setEditEmail, editNickname, setEditNickname,
    editPassword, setEditPassword, exporting, pageCount, currentPage,
    firstVisible, lastVisible, addUser, editUser, openEditUser, removeUser,
    exportUsers, refreshUsers,
  } = useAdminUsersController();

  return <div className="admin-users-page">
    <AdminNavigation active="users" />
    <header className="admin-users-hero mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="admin-users-hero-copy"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">User management</h1><p className="page-intro-description mt-2">Search, manage, and export accounts.</p></div>
      <div className="admin-users-actions flex flex-wrap gap-2">
        <Button variant="secondary" onClick={refreshUsers} disabled={loading}><RefreshCw size={16} /> Refresh</Button>
        <Button variant="secondary" onClick={() => void exportUsers()} disabled={exporting}>{exporting ? "Exporting…" : <><Download size={16} /> Export CSV</>}</Button>
        <Button onClick={() => setShowAddForm((value) => !value)}><UserPlus size={16} /> Add user</Button>
      </div>
    </header>

    {error && <AutoDismissMessage key={error} variant="error" className="mb-4 whitespace-pre-line">{error}</AutoDismissMessage>}
    {notice && <AutoDismissMessage key={notice} variant="success" className="mb-4">{notice}</AutoDismissMessage>}

    {showAddForm && <AdminAddUserForm
      email={email}
      onEmailChange={setEmail}
      nickname={nickname}
      onNicknameChange={setNickname}
      password={password}
      onPasswordChange={setPassword}
      busy={busy}
      onSubmit={(event) => void addUser(event)}
    />}

    <AdminEditUserDialog
      editingUser={editingUser}
      onEditingUserChange={setEditingUser}
      email={editEmail}
      onEmailChange={setEditEmail}
      nickname={editNickname}
      onNicknameChange={setEditNickname}
      password={editPassword}
      onPasswordChange={setEditPassword}
      busy={busy}
      onSubmit={(event) => void editUser(event)}
    />

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
