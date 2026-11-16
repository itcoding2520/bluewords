"use client";

import { Download, RefreshCw, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useAdminUsersController } from "@/hooks/useAdminUsersController";
import { AdminAddUserForm, AdminEditUserDialog } from "@/components/admin/AdminUserForms";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

export function AdminUsersManagement() {
  const { directory, addForm, editForm, actions, export: usersExport } = useAdminUsersController();

  return <div className="admin-users-page">
    <AdminNavigation active="users" />
    <header className="admin-users-hero mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="admin-users-hero-copy"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">User management</h1><p className="page-intro-description mt-2">Search, manage, and export accounts.</p></div>
      <div className="admin-users-actions flex flex-wrap gap-2">
        <Button variant="secondary" onClick={directory.refresh} disabled={directory.loading}><RefreshCw size={16} /> Refresh</Button>
        <Button variant="secondary" onClick={() => void usersExport.run()} disabled={usersExport.isExporting}>{usersExport.isExporting ? "Exporting…" : <><Download size={16} /> Export CSV</>}</Button>
        <Button onClick={() => addForm.setIsOpen((value) => !value)}><UserPlus size={16} /> Add user</Button>
      </div>
    </header>

    {directory.error && <AutoDismissMessage key={directory.error} variant="error" className="mb-4 whitespace-pre-line">{directory.error}</AutoDismissMessage>}
    {actions.notice && <AutoDismissMessage key={actions.notice} variant="success" className="mb-4">{actions.notice}</AutoDismissMessage>}

    {addForm.isOpen && <AdminAddUserForm
      email={addForm.email}
      onEmailChange={addForm.setEmail}
      nickname={addForm.nickname}
      onNicknameChange={addForm.setNickname}
      password={addForm.password}
      onPasswordChange={addForm.setPassword}
      busy={actions.busy}
      onSubmit={(event) => void addForm.submit(event)}
    />}

    <AdminEditUserDialog
      editingUser={editForm.user}
      onEditingUserChange={editForm.setUser}
      email={editForm.email}
      onEmailChange={editForm.setEmail}
      nickname={editForm.nickname}
      onNicknameChange={editForm.setNickname}
      password={editForm.password}
      onPasswordChange={editForm.setPassword}
      busy={actions.busy}
      onSubmit={(event) => void editForm.submit(event)}
    />

    <AdminUsersTable
      users={directory.users}
      total={directory.total}
      pageSize={directory.pageSize}
      pageCount={directory.pageCount}
      currentPage={directory.currentPage}
      firstVisible={directory.firstVisible}
      lastVisible={directory.lastVisible}
      search={directory.search}
      loading={directory.loading}
      busy={actions.busy}
      onSearchChange={directory.changeSearch}
      onPageSizeChange={directory.changePageSize}
      onPrevious={directory.previousPage}
      onNext={directory.nextPage}
      onEdit={actions.openEditUser}
      onRemove={(user) => void actions.removeUser(user)}
    />
  </div>;
}
