"use client";

import { Check, KeyRound } from "lucide-react";
import type { FormEventHandler } from "react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";

interface ProfilePasswordSectionProps {
  newPassword: string;
  confirmPassword: string;
  isSaving: boolean;
  error: string;
  notice: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

export function ProfilePasswordSection({
  newPassword,
  confirmPassword,
  isSaving,
  error,
  notice,
  onSubmit,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: ProfilePasswordSectionProps) {
  return (
    <section className="profile-password-section mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="profile-field-icon profile-email-icon"><KeyRound size={20} /></span>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Change password</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a new password with at least 8 characters.</p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-slate-700" htmlFor="profile-new-password">
          New password
          <PasswordInput id="profile-new-password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => onNewPasswordChange(event.target.value)} placeholder="Enter new password" disabled={isSaving} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        </label>
        <label className="block text-sm font-bold text-slate-700" htmlFor="profile-confirm-password">
          Confirm new password
          <PasswordInput id="profile-confirm-password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} placeholder="Enter it again" disabled={isSaving} className="mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
        </label>
        <div className="sm:col-span-2">
          {error && <AutoDismissMessage key={error} variant="error" className="mb-3">{error}</AutoDismissMessage>}
          {notice && <AutoDismissMessage key={notice} variant="success" className="mb-3 inline-flex items-center gap-2"><Check size={16} /> {notice}</AutoDismissMessage>}
          <Button type="submit" disabled={isSaving || newPassword.length < 8 || confirmPassword.length < 8}>
            <KeyRound size={16} /> {isSaving ? "Updating password…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}
