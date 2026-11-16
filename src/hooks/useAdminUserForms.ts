import { useState } from "react";
import type { AdminUserRecord } from "@/lib/admin-user-api";
import { useStateField } from "@/hooks/useStateField";

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
  const setEmail = useStateField(setAddForm, "email");
  const setNickname = useStateField(setAddForm, "nickname");
  const setPassword = useStateField(setAddForm, "password");
  const setShowAddForm = useStateField(setAddForm, "isOpen");
  const setEditingUser = useStateField(setEditForm, "user");
  const setEditEmail = useStateField(setEditForm, "email");
  const setEditNickname = useStateField(setEditForm, "nickname");
  const setEditPassword = useStateField(setEditForm, "password");

  return {
    addForm,
    setAddForm,
    editForm,
    setEditForm,
    email: addForm.email,
    setEmail,
    nickname: addForm.nickname,
    setNickname,
    password: addForm.password,
    setPassword,
    showAddForm: addForm.isOpen,
    setShowAddForm,
    editingUser: editForm.user,
    setEditingUser,
    editEmail: editForm.email,
    setEditEmail,
    editNickname: editForm.nickname,
    setEditNickname,
    editPassword: editForm.password,
    setEditPassword,
  };
}

