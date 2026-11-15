import { getErrorMessage } from "@/lib/errors";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { sendAdminUserAction, type AdminUserRecord } from "@/lib/admin-user-api";

export type AdminUser = AdminUserRecord;

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
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [editPassword, setEditPassword] = useState("");

  function showMutationResult(payload: { error?: string }, fallback: string) {
    if (payload.error) {
      setError(payload.error);
      setNotice("");
    } else {
      setError("");
      setNotice(fallback);
      refreshUsers();
    }
  }

  async function performUserAction(action: string, values: Record<string, string>) {
    setBusy(values.userId ?? action);
    setError("");
    setNotice("");
    try {
      const payload = await sendAdminUserAction(action, values);
      showMutationResult(payload, action === "delete" ? "User removed." : action === "create" ? "User created." : "User saved.");
      return true;
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not complete this user action."));
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

  return {
    busy, notice, setNotice, email, setEmail, nickname, setNickname, password, setPassword,
    showAddForm, setShowAddForm, editingUser, setEditingUser, editEmail, setEditEmail,
    editNickname, setEditNickname, editPassword, setEditPassword,
    addUser, editUser, openEditUser, removeUser,
  };
}
