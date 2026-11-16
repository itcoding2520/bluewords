import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { UserProfile } from "@/lib/supabase/user-profile";
import { validateUserAvatar } from "@/lib/supabase/user-profile-avatars";

interface AvatarSelectionState {
  file: File | null;
  remove: boolean;
  previewUrl: string | null;
}

export function useUserProfileAvatar({
  profile,
  setError,
  setNotice,
}: {
  profile: UserProfile | null;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const [selection, setSelection] = useState<AvatarSelectionState>({ file: null, remove: false, previewUrl: null });

  useEffect(() => {
    if (!selection.file) return;
    let active = true;
    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = reader.result;
      if (active && typeof previewUrl === "string") setSelection((current) => ({ ...current, previewUrl }));
    };
    reader.readAsDataURL(selection.file);
    return () => {
      active = false;
      reader.abort();
    };
  }, [selection.file]);

  function selectAvatar(file: File | undefined) {
    setError("");
    setNotice("");
    if (!file) return;
    const validationError = validateUserAvatar(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelection({ file, previewUrl: null, remove: false });
  }

  function removeSelectedAvatar() {
    setSelection({ file: null, previewUrl: null, remove: Boolean(profile?.avatar_path) });
    setError("");
    setNotice("");
  }

  function undoAvatarRemoval() {
    setSelection((current) => ({ ...current, remove: false }));
  }

  function resetAvatarSelection() {
    setSelection({ file: null, previewUrl: null, remove: false });
  }

  return {
    avatarFile: selection.file,
    removeAvatar: selection.remove,
    previewUrl: selection.previewUrl,
    previewPath: selection.remove ? null : profile?.avatar_path,
    selectAvatar,
    removeSelectedAvatar,
    undoAvatarRemoval,
    resetAvatarSelection,
  };
}
