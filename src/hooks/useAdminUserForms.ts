import { useState, type SetStateAction } from "react";
import type { AdminUserRecord } from "@/lib/admin-user-api";
import { updateStateField } from "@/lib/state-action";

interface AddUserFormState {
  email: string;
  nickname: string;
  password: string;
  isOpen: boolean;
}

interface EditUserFormState {
  user: AdminUserRecord | null;
  email: string;
  nickname: string;
  password: string;
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
    setEmail: (action: SetStateAction<string>) => updateStateField(setAddForm, "email", action),
    nickname: addForm.nickname,
    setNickname: (action: SetStateAction<string>) => updateStateField(setAddForm, "nickname", action),
    password: addForm.password,
    setPassword: (action: SetStateAction<string>) => updateStateField(setAddForm, "password", action),
    showAddForm: addForm.isOpen,
    setShowAddForm: (action: SetStateAction<boolean>) => updateStateField(setAddForm, "isOpen", action),
    editingUser: editForm.user,
    setEditingUser: (action: SetStateAction<AdminUserRecord | null>) => updateStateField(setEditForm, "user", action),
    editEmail: editForm.email,
    setEditEmail: (action: SetStateAction<string>) => updateStateField(setEditForm, "email", action),
    editNickname: editForm.nickname,
    setEditNickname: (action: SetStateAction<string>) => updateStateField(setEditForm, "nickname", action),
    editPassword: editForm.password,
    setEditPassword: (action: SetStateAction<string>) => updateStateField(setEditForm, "password", action),
  };
}

