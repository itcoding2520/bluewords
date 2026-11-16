import { useState, type Dispatch, type SetStateAction } from "react";
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

function updateField<TState, TKey extends keyof TState>(
  setState: Dispatch<SetStateAction<TState>>,
  key: TKey,
  action: SetStateAction<TState[TKey]>,
) {
  setState((current) => ({
    ...current,
    [key]: applyFieldAction(current[key], action),
  }));
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
    setEmail: (action: SetStateAction<string>) => updateField(setAddForm, "email", action),
    nickname: addForm.nickname,
    setNickname: (action: SetStateAction<string>) => updateField(setAddForm, "nickname", action),
    password: addForm.password,
    setPassword: (action: SetStateAction<string>) => updateField(setAddForm, "password", action),
    showAddForm: addForm.isOpen,
    setShowAddForm: (action: SetStateAction<boolean>) => updateField(setAddForm, "isOpen", action),
    editingUser: editForm.user,
    setEditingUser: (action: SetStateAction<AdminUser | null>) => updateField(setEditForm, "user", action),
    editEmail: editForm.email,
    setEditEmail: (action: SetStateAction<string>) => updateField(setEditForm, "email", action),
    editNickname: editForm.nickname,
    setEditNickname: (action: SetStateAction<string>) => updateField(setEditForm, "nickname", action),
    editPassword: editForm.password,
    setEditPassword: (action: SetStateAction<string>) => updateField(setEditForm, "password", action),
  };
}

