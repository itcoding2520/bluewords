import type { FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import type { AdminUserRecord } from "@/lib/admin-user-api";

export function AdminAddUserForm({
  email,
  onEmailChange,
  nickname,
  onNicknameChange,
  password,
  onPasswordChange,
  busy,
  onSubmit,
}: {
  email: string;
  onEmailChange: (value: string) => void;
  nickname: string;
  onNicknameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  busy: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
        <input type="email" required value={email} onChange={(event) => onEmailChange(event.target.value)} placeholder="Email" aria-label="New user email" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <input value={nickname} onChange={(event) => onNicknameChange(event.target.value)} maxLength={60} placeholder="Nickname (optional)" aria-label="New user nickname" className="h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <PasswordInput required minLength={8} value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Temporary password (8+ chars)" aria-label="New user password" className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        <Button type="submit" disabled={busy === "create"}>Create user</Button>
      </div>
    </form>
  );
}

export function AdminEditUserDialog({
  editingUser,
  onEditingUserChange,
  email,
  onEmailChange,
  nickname,
  onNicknameChange,
  password,
  onPasswordChange,
  busy,
  onSubmit,
}: {
  editingUser: AdminUserRecord | null;
  onEditingUserChange: (user: AdminUserRecord | null) => void;
  email: string;
  onEmailChange: (value: string) => void;
  nickname: string;
  onNicknameChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  busy: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog.Root open={editingUser !== null} onOpenChange={(open) => { if (!open && !busy) onEditingUserChange(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm" />
        <Dialog.Content aria-describedby="edit-user-description" className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-24px)] w-[calc(100%-24px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div><Dialog.Title className="text-lg font-semibold text-slate-950">Edit user</Dialog.Title><Dialog.Description id="edit-user-description" className="mt-1 text-sm text-slate-500">Update account details for {editingUser?.email}.</Dialog.Description></div>
            <Dialog.Close asChild><button type="button" aria-label="Close edit user dialog" disabled={busy !== null} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button></Dialog.Close>
          </div>
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-slate-700">Email<input type="email" required value={email} onChange={(event) => onEmailChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
            <label className="block text-sm font-medium text-slate-700">Nickname<input value={nickname} maxLength={24} onChange={(event) => onNicknameChange(event.target.value)} placeholder="Leave blank to clear nickname" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><span className="mt-1 block text-xs font-normal text-slate-500">Use 2–24 characters, or leave blank.</span></label>
            <label className="block text-sm font-medium text-slate-700">New password<PasswordInput minLength={8} value={password} onChange={(event) => onPasswordChange(event.target.value)} placeholder="Leave blank to keep current password" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><span className="mt-1 block text-xs font-normal text-slate-500">At least 8 characters when changing.</span></label>
            <div className="flex justify-end gap-2 pt-2"><Dialog.Close asChild><Button type="button" variant="secondary" disabled={busy !== null}>Cancel</Button></Dialog.Close><Button type="submit" disabled={busy === editingUser?.id}>{busy === editingUser?.id ? "Saving…" : "Save changes"}</Button></div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
