"use client";

import { useCallback, useState, type FormEvent } from "react";
import { getErrorMessage } from "@/lib/errors";

import type { UserProfile } from "@/lib/supabase/user-profile";
import { removeReplacedProfileAvatar, saveProfileWithAvatar } from "@/lib/supabase/user-profile-workflows";
import { useEditableUserProfileData } from "@/hooks/useEditableUserProfileData";
import { useUserProfileAvatar } from "@/hooks/useUserProfileAvatar";
import { useFeedbackMessages } from "@/hooks/useFeedbackMessages";

export function useUserProfileEditor(userId: string) {
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const feedback = useFeedbackMessages();
  const onProfileLoaded = useCallback((loadedProfile: UserProfile | null) => {
    setNickname(loadedProfile?.nickname ?? "");
  }, []);
  const profileData = useEditableUserProfileData({ userId, onProfileLoaded, setError: feedback.setError });
  const { profile, setProfile } = profileData;

  const avatar = useUserProfileAvatar({ profile, setError: feedback.setError, setNotice: feedback.setNotice });

  const normalizedNickname = nickname.trim();
  const hasChanges = normalizedNickname !== (profile?.nickname ?? "") || Boolean(avatar.avatarFile) || avatar.removeAvatar;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    feedback.setError("");
    feedback.setNotice("");

    try {
      const previousAvatarPath = profile?.avatar_path ?? null;
      const { profile: updatedProfile } = await saveProfileWithAvatar({
        nickname: normalizedNickname || null,
        avatarFile: avatar.avatarFile,
        avatarPath: avatar.previewPath ?? null,
        previousAvatarPath,
      });

      setProfile(updatedProfile);
      setNickname(updatedProfile.nickname ?? "");
      avatar.resetAvatarSelection();
      feedback.setNotice("Profile updated.");
      await removeReplacedProfileAvatar(previousAvatarPath, updatedProfile.avatar_path);
    } catch (saveError) {
      const code = typeof saveError === "object" && saveError && "code" in saveError
        ? saveError.code
        : null;
      feedback.setError(code === "23505"
        ? "That nickname is already in use. Choose another one."
        : getErrorMessage(saveError, "Could not save your profile. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  function changeNickname(value: string) {
    setNickname(value);
    feedback.setError("");
    feedback.setNotice("");
  }

  return {
    profile,
    nickname,
    avatarFile: avatar.avatarFile,
    removeAvatar: avatar.removeAvatar,
    previewUrl: avatar.previewUrl,
    previewPath: avatar.previewPath,
    loading: profileData.loading,
    saving,
    error: feedback.error,
    notice: feedback.notice,
    normalizedNickname,
    hasChanges,
    saveProfile,
    selectAvatar: avatar.selectAvatar,
    removeSelectedAvatar: avatar.removeSelectedAvatar,
    undoAvatarRemoval: avatar.undoAvatarRemoval,
    changeNickname,
  };
}
