"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  deleteUserAvatar,
  getUserProfile,
  saveUserProfile,
  uploadUserAvatar,
  type UserProfile,
} from "@/lib/supabase/user-profile";
import { useUserProfileAvatar } from "@/hooks/useUserProfileAvatar";

export function useUserProfileEditor(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nickname, setNickname] = useState("");
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

  const avatar = useUserProfileAvatar({ profile, setError, setNotice });

  const normalizedNickname = nickname.trim();
  const hasChanges = normalizedNickname !== (profile?.nickname ?? "") || Boolean(avatar.avatarFile) || avatar.removeAvatar;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    let uploadedPath: string | null = null;
    try {
      const previousAvatarPath = profile?.avatar_path ?? null;
      if (avatar.avatarFile) uploadedPath = await uploadUserAvatar(avatar.avatarFile);
      const updatedProfile = await saveUserProfile({
        nickname: normalizedNickname || null,
        avatarPath: uploadedPath ?? avatar.previewPath ?? null,
      });

      setProfile(updatedProfile);
      setNickname(updatedProfile.nickname ?? "");
      avatar.resetAvatarSelection();
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

  function changeNickname(value: string) {
    setNickname(value);
    setError("");
    setNotice("");
  }

  return {
    profile,
    nickname,
    avatarFile: avatar.avatarFile,
    removeAvatar: avatar.removeAvatar,
    previewUrl: avatar.previewUrl,
    previewPath: avatar.previewPath,
    loading,
    saving,
    error,
    notice,
    normalizedNickname,
    hasChanges,
    saveProfile,
    selectAvatar: avatar.selectAvatar,
    removeSelectedAvatar: avatar.removeSelectedAvatar,
    undoAvatarRemoval: avatar.undoAvatarRemoval,
    changeNickname,
  };
}
