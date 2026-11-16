"use client";

import { getErrorMessage } from "@/lib/errors";
import { useState, type FormEvent } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { updateAccountPassword } from "@/lib/supabase/account-security";

export function useProfilePasswordChange() {
  const supabase = useSupabaseClient();
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
    isSaving: false,
    error: "",
    notice: "",
  });

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordForm((current) => ({ ...current, error: "", notice: "" }));
    if (passwordForm.newPassword.length < 8) {
      setPasswordForm((current) => ({ ...current, error: "Use a password with at least 8 characters." }));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordForm((current) => ({ ...current, error: "The passwords do not match." }));
      return;
    }

    setPasswordForm((current) => ({ ...current, isSaving: true }));
    try {
      await updateAccountPassword(supabase, passwordForm.newPassword);
      setPasswordForm((current) => ({
        ...current,
        newPassword: "",
        confirmPassword: "",
        notice: "Your password has been updated.",
      }));
    } catch (error) {
      setPasswordForm((current) => ({
        ...current,
        error: getErrorMessage(error, "Could not update your password. Please try again."),
      }));
    } finally {
      setPasswordForm((current) => ({ ...current, isSaving: false }));
    }
  }

  function changeNewPassword(value: string) {
    setPasswordForm((current) => ({ ...current, newPassword: value, error: "", notice: "" }));
  }

  function changeConfirmPassword(value: string) {
    setPasswordForm((current) => ({ ...current, confirmPassword: value, error: "", notice: "" }));
  }

  return {
    newPassword: passwordForm.newPassword,
    confirmPassword: passwordForm.confirmPassword,
    passwordSaving: passwordForm.isSaving,
    passwordError: passwordForm.error,
    passwordNotice: passwordForm.notice,
    changePassword,
    changeNewPassword,
    changeConfirmPassword,
  };
}
