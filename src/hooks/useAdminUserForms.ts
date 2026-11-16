import { useState, type SetStateAction } from "react";
import type { AdminUserRecord } from "@/lib/admin-user-api";

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

export function useAdminUserForms() {
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

  return {
    addForm,
    setAddForm,
    editForm,
    setEditForm,
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
  };
}

