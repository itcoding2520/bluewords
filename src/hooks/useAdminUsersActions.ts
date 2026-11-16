import { type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { AdminUserActionInput, AdminUserRecord } from "@/lib/admin-user-api";
import { useAdminUserMutation } from "@/hooks/useAdminUserMutation";
import { useAdminUserForms } from "@/hooks/useAdminUserForms";

export function useAdminUsersActions({
  setPage,
  setError,
  refreshUsers,
}: {
  setPage: Dispatch<SetStateAction<number>>;
  setError: Dispatch<SetStateAction<string>>;
  refreshUsers: () => void;
}) {
  const confirmDialog = useConfirmDialog();
  const { busy, notice, setNotice, performUserAction } = useAdminUserMutation({ setError, refreshUsers });
  const forms = useAdminUserForms();
  const { addForm, setAddForm, editForm, setEditForm } = forms;

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await performUserAction({ action: "create", email: addForm.email.trim(), nickname: addForm.nickname.trim(), password: addForm.password })) {
      setAddForm({ email: "", nickname: "", password: "", isOpen: false });
      setPage(1);
    }
  }

  function openEditUser(user: AdminUserRecord) {
    setEditForm({
      user,
      email: user.email ?? "",
      nickname: user.nickname,
      password: "",
    });
    setError("");
    setNotice("");
  }

  async function editUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm.user) return;
    const values: Extract<AdminUserActionInput, { action: "update" }> = {
      action: "update",
      userId: editForm.user.id,
      email: editForm.email.trim(),
      nickname: editForm.nickname.trim(),
    };
    if (editForm.password) values.password = editForm.password;
    if (await performUserAction(values)) {
      setEditForm((current) => ({ ...current, user: null, password: "" }));
    }
  }

  async function removeUser(user: AdminUserRecord) {
    const confirmed = await confirmDialog({ title: "Remove user?", description: `Remove ${user.email ?? user.id}? This permanently deletes their account, vocabulary, and history.`, confirmLabel: "Remove" });
    if (!confirmed) return;
    await performUserAction({ action: "delete", userId: user.id });
  }

  return {
    busy,
    notice,
    setNotice,
    email: forms.email,
    setEmail: forms.setEmail,
    nickname: forms.nickname,
    setNickname: forms.setNickname,
    password: forms.password,
    setPassword: forms.setPassword,
    showAddForm: forms.showAddForm,
    setShowAddForm: forms.setShowAddForm,
    editingUser: forms.editingUser,
    setEditingUser: forms.setEditingUser,
    editEmail: forms.editEmail,
    setEditEmail: forms.setEditEmail,
    editNickname: forms.editNickname,
    setEditNickname: forms.setEditNickname,
    editPassword: forms.editPassword,
    setEditPassword: forms.setEditPassword,
    addUser, editUser, openEditUser, removeUser,
  };
}
