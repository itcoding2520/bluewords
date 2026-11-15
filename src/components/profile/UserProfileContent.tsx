"use client";

import { Check, Star } from "lucide-react";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { ProfilePasswordSection } from "@/components/profile/ProfilePasswordSection";
import { ProfileAvatarSection } from "@/components/profile/ProfileAvatarSection";
import { ProfileAccountFields } from "@/components/profile/ProfileAccountFields";
import { ProfileSaveFooter } from "@/components/profile/ProfileSaveFooter";
import { useUserProfileEditor } from "@/hooks/useUserProfileEditor";
import { useProfilePasswordChange } from "@/hooks/useProfilePasswordChange";

interface UserProfileContentProps {
  userId: string;
  email: string | null;
}

export function UserProfileContent({ userId, email }: UserProfileContentProps) {
  const editor = useUserProfileEditor(userId);
  const password = useProfilePasswordChange();
  const {
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
  } = editor;
  const {
    newPassword,
    confirmPassword,
    passwordSaving,
    passwordError,
    passwordNotice,
    changePassword,
    changeNewPassword,
    changeConfirmPassword,
  } = password;

  return (
    <div className="profile-page mx-auto max-w-5xl">
      <header className="profile-hero mb-6">
        <p className="text-sm font-medium text-blue-600">Your account</p>
        <h1 className="page-title mt-1">Profile <Star aria-hidden="true" className="inline size-6 fill-amber-400 text-amber-400" /></h1>
        <p className="page-intro-description mt-2">Choose how you appear in BlueWords and on game leaderboards.</p>
      </header>

      <form onSubmit={saveProfile} className="profile-form rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <ProfileAvatarSection
          nickname={normalizedNickname}
          savedNickname={profile?.nickname}
          email={email}
          previewUrl={previewUrl}
          previewPath={previewPath}
          hasSelectedImage={Boolean(avatarFile)}
          hasSavedImage={Boolean(profile?.avatar_path)}
          isRemovingImage={removeAvatar}
          disabled={loading || saving}
          onSelectImage={selectAvatar}
          onRemoveImage={removeSelectedAvatar}
          onUndoRemoval={undoAvatarRemoval}
        />

        <div className="profile-divider my-6 border-t border-slate-100" />

        <ProfileAccountFields
          nickname={nickname}
          email={email}
          disabled={loading || saving}
          onNicknameChange={changeNickname}
        />

        {error && <AutoDismissMessage key={error} variant="error" className="mt-5">{error}</AutoDismissMessage>}
        {notice && <AutoDismissMessage key={notice} variant="success" className="mt-5 inline-flex items-center gap-2"><Check size={16} /> {notice}</AutoDismissMessage>}

        <ProfileSaveFooter
          saving={saving}
          disabled={loading || saving || !hasChanges}
        />
      </form>

      <ProfilePasswordSection
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        isSaving={passwordSaving}
        error={passwordError}
        notice={passwordNotice}
        onSubmit={changePassword}
        onNewPasswordChange={changeNewPassword}
        onConfirmPasswordChange={changeConfirmPassword}
      />
    </div>
  );
}
