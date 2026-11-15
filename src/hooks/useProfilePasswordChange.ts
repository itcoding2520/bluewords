"use client";

import { useState, type FormEvent } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

export function useProfilePasswordChange() {
  const supabase = useSupabaseClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordNotice("");
    if (newPassword.length < 8) {
      setPasswordError("Use a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("The passwords do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice("Your password has been updated.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Could not update your password. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function changeNewPassword(value: string) {
    setNewPassword(value);
    setPasswordError("");
    setPasswordNotice("");
  }

  function changeConfirmPassword(value: string) {
    setConfirmPassword(value);
    setPasswordError("");
    setPasswordNotice("");
  }

  return {
    newPassword,
    confirmPassword,
    passwordSaving,
    passwordError,
    passwordNotice,
    changePassword,
    changeNewPassword,
    changeConfirmPassword,
  };
}
