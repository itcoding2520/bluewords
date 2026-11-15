"use client";

import { Download, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useAdminUsersController } from "@/hooks/useAdminUsersController";
import { AdminAddUserForm, AdminEditUserDialog } from "@/components/admin/AdminUserForms";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

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

    <AdminUsersTable
      users={users}
      total={total}
      pageSize={pageSize}
      pageCount={pageCount}
      currentPage={currentPage}
      firstVisible={firstVisible}
      lastVisible={lastVisible}
      search={search}
      loading={loading}
      busy={busy}
      onSearchChange={(value) => { setSearch(value); setPage(1); }}
      onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
      onPrevious={() => setPage((value) => Math.max(1, value - 1))}
      onNext={() => setPage((value) => Math.min(pageCount, value + 1))}
      onEdit={openEditUser}
      onRemove={(user) => void removeUser(user)}
    />
  </div>;
}
