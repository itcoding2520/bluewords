import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { validateUserAvatar, type UserProfile } from "@/lib/supabase/user-profile";

export function useUserProfileAvatar({
  profile,
  setError,
  setNotice,
}: {
  profile: UserProfile | null;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  function resetAvatarSelection() {
    setAvatarFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(false);
  }

  return {
    avatarFile,
    removeAvatar,
    previewUrl,
    previewPath: removeAvatar ? null : profile?.avatar_path,
    selectAvatar,
    removeSelectedAvatar,
    undoAvatarRemoval,
    resetAvatarSelection,
  };
}
