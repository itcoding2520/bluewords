"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  deleteUserAvatar,
  getUserProfile,
  saveUserProfile,
  uploadUserAvatar,
  validateUserAvatar,
  type UserProfile,
} from "@/lib/supabase/user-profile";

export function useUserProfileEditor(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void getUserProfile(userId).then((loadedProfile) => {
      if (!active) return;
      setProfile(loadedProfile);
      setNickname(loadedProfile?.nickname ?? "");
    }).catch(() => {
      if (active) setError("Could not load your profile. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!avatarFile) return;
    let active = true;
    const reader = new FileReader();
    reader.onload = () => {
      if (active && typeof reader.result === "string") setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(avatarFile);
    return () => {
      active = false;
      reader.abort();
    };
  }, [avatarFile]);

  const normalizedNickname = nickname.trim();
  const hasChanges = normalizedNickname !== (profile?.nickname ?? "") || Boolean(avatarFile) || removeAvatar;
  const previewPath = removeAvatar ? null : profile?.avatar_path;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    let uploadedPath: string | null = null;
    try {
      const previousAvatarPath = profile?.avatar_path ?? null;
      if (avatarFile) uploadedPath = await uploadUserAvatar(avatarFile);
      const updatedProfile = await saveUserProfile({
        nickname: normalizedNickname || null,
        avatarPath: uploadedPath ?? previewPath ?? null,
      });

      setProfile(updatedProfile);
      setNickname(updatedProfile.nickname ?? "");
      setAvatarFile(null);
      setPreviewUrl(null);
      setRemoveAvatar(false);
      setNotice("Profile updated.");

      if (previousAvatarPath && previousAvatarPath !== updatedProfile.avatar_path) {
        try {
          await deleteUserAvatar(previousAvatarPath);
        } catch (cleanupError) {
          console.warn("Could not remove the previous profile avatar:", cleanupError);
        }
      }
    } catch (saveError) {
      if (uploadedPath) {
        try {
          await deleteUserAvatar(uploadedPath);
        } catch (cleanupError) {
          console.warn("Could not remove the unused profile avatar:", cleanupError);
        }
      }

      const code = typeof saveError === "object" && saveError && "code" in saveError
        ? saveError.code
        : null;
      setError(code === "23505"
        ? "That nickname is already in use. Choose another one."
        : saveError instanceof Error
          ? saveError.message
          : "Could not save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function selectAvatar(file: File | undefined) {
    setError("");
    setNotice("");
    if (!file) return;
    const validationError = validateUserAvatar(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setAvatarFile(file);
    setPreviewUrl(null);
    setRemoveAvatar(false);
  }

  function removeSelectedAvatar() {
    setAvatarFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(Boolean(profile?.avatar_path));
    setError("");
    setNotice("");
  }

  function undoAvatarRemoval() {
    setRemoveAvatar(false);
  }

  function changeNickname(value: string) {
    setNickname(value);
    setError("");
    setNotice("");
  }

  return {
    profile,
    nickname,
    avatarFile,
    removeAvatar,
    previewUrl,
    loading,
    saving,
    error,
    notice,
    normalizedNickname,
    hasChanges,
    previewPath,
    saveProfile,
    selectAvatar,
    removeSelectedAvatar,
    undoAvatarRemoval,
    changeNickname,
  };
}
