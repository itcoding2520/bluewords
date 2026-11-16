import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { AdminUserActionInput, AdminUserRecord } from "@/lib/admin-user-api";
import { useAdminUserMutation } from "@/hooks/useAdminUserMutation";

export type AdminUser = AdminUserRecord;

interface AddUserFormState {
  email: string;
  nickname: string;
  password: string;
  isOpen: boolean;
}

interface EditUserFormState {
  user: AdminUser | null;
  email: string;
  nickname: string;
  password: string;
}

function applyFieldAction<T>(current: T, action: SetStateAction<T>): T {
  return typeof action === "function" ? (action as (previous: T) => T)(current) : action;
}

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
  const [addForm, setAddForm] = useState<AddUserFormState>({
    email: "",
    nickname: "",
    password: "",
    isOpen: false,
  });
  const [editForm, setEditForm] = useState<EditUserFormState>({
    user: null,
    email: "",
    nickname: "",
    password: "",
  });

  async function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await performUserAction({ action: "create", email: addForm.email.trim(), nickname: addForm.nickname.trim(), password: addForm.password })) {
      setAddForm({ email: "", nickname: "", password: "", isOpen: false });
      setPage(1);
    }
  }

  function openEditUser(user: AdminUser) {
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

  async function removeUser(user: AdminUser) {
    const confirmed = await confirmDialog({ title: "Remove user?", description: `Remove ${user.email ?? user.id}? This permanently deletes their account, vocabulary, and history.`, confirmLabel: "Remove" });
    if (!confirmed) return;
    await performUserAction({ action: "delete", userId: user.id });
  }

  return {
    busy,
    notice,
    setNotice,
    email: addForm.email,
    setEmail: (action: SetStateAction<string>) => setAddForm((current) => ({
      ...current,
      email: applyFieldAction(current.email, action),
    })),
    nickname: addForm.nickname,
    setNickname: (action: SetStateAction<string>) => setAddForm((current) => ({
      ...current,
      nickname: applyFieldAction(current.nickname, action),
    })),
    password: addForm.password,
    setPassword: (action: SetStateAction<string>) => setAddForm((current) => ({
      ...current,
      password: applyFieldAction(current.password, action),
    })),
    showAddForm: addForm.isOpen,
    setShowAddForm: (action: SetStateAction<boolean>) => setAddForm((current) => ({
      ...current,
      isOpen: applyFieldAction(current.isOpen, action),
    })),
    editingUser: editForm.user,
    setEditingUser: (action: SetStateAction<AdminUser | null>) => setEditForm((current) => ({
      ...current,
      user: applyFieldAction(current.user, action),
    })),
    editEmail: editForm.email,
    setEditEmail: (action: SetStateAction<string>) => setEditForm((current) => ({
      ...current,
      email: applyFieldAction(current.email, action),
    })),
    editNickname: editForm.nickname,
    setEditNickname: (action: SetStateAction<string>) => setEditForm((current) => ({
      ...current,
      nickname: applyFieldAction(current.nickname, action),
    })),
    editPassword: editForm.password,
    setEditPassword: (action: SetStateAction<string>) => setEditForm((current) => ({
      ...current,
      password: applyFieldAction(current.password, action),
    })),
    addUser, editUser, openEditUser, removeUser,
  };
}
