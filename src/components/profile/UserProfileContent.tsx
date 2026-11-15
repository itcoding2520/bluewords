"use client";

import { Camera, Check, ImagePlus, LockKeyhole, Mail, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";

import { UserAvatar } from "@/components/user/UserAvatar";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { ProfilePasswordSection } from "@/components/profile/ProfilePasswordSection";
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
        <div className="profile-avatar-section flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="profile-avatar-display flex justify-center sm:justify-start">
            {previewUrl ? (
              <span role="img" aria-label="New avatar preview" className="profile-avatar-preview size-40 rounded-full bg-cover bg-center ring-4 ring-blue-50" style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }} />
            ) : (
              <UserAvatar
                nickname={normalizedNickname || profile?.nickname}
                email={email}
                fallbackName="User"
                avatarPath={previewPath}
                sizeClassName="profile-avatar-preview size-40 text-5xl ring-4 ring-white"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-extrabold text-slate-900">Profile picture</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">If you skip the image, we’ll use the first letter of your nickname or email.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <label className="profile-avatar-change inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-base font-bold text-slate-700 transition hover:bg-slate-50">
                <ImagePlus size={16} /> {avatarFile || profile?.avatar_path ? "Change image" : "Upload image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={loading || saving} onChange={(event) => { selectAvatar(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              </label>
              {(avatarFile || (profile?.avatar_path && !removeAvatar)) && (
                <button type="button" onClick={removeSelectedAvatar} className="profile-avatar-remove inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold text-red-600 transition hover:bg-red-50">
                  <Trash2 size={15} /> Remove image
                </button>
              )}
              {removeAvatar && profile?.avatar_path && !avatarFile && (
                <button type="button" onClick={undoAvatarRemoval} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Undo
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-400">JPEG, PNG, or WebP · maximum 5 MB · shown publicly on leaderboards.</p>
          </div>
        </div>

        <div className="profile-divider my-6 border-t border-slate-100" />

        <div className="profile-fields space-y-3">
          <div className="profile-nickname-field">
            <label htmlFor="profile-nickname" className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-800"><span className="profile-field-icon"><UserRound size={21} /></span> Nickname <Star aria-hidden="true" className="ml-auto size-5 fill-amber-400 text-amber-400" /></label>
            <input
              id="profile-nickname"
              value={nickname}
              onChange={(event) => changeNickname(event.target.value)}
              maxLength={24}
              minLength={2}
              autoComplete="nickname"
              placeholder="How should we call you?"
              className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              disabled={loading || saving}
            />
            <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>Unique across BlueWords · 2–24 characters.</span>
              <span>{nickname.length}/24</span>
            </div>
          </div>

          <div className="profile-email-field rounded-xl bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-base font-extrabold text-slate-800"><span className="profile-field-icon profile-email-icon"><Mail size={20} /></span> Account email</p>
            <p className="profile-email-value mt-2 flex items-center justify-between gap-3 break-all text-base text-slate-700"><span>{email ?? "Unavailable"}</span><LockKeyhole className="size-5 shrink-0 text-slate-400" /></p>
          </div>
        </div>

        {error && <AutoDismissMessage key={error} variant="error" className="mt-5">{error}</AutoDismissMessage>}
        {notice && <AutoDismissMessage key={notice} variant="success" className="mt-5 inline-flex items-center gap-2"><Check size={16} /> {notice}</AutoDismissMessage>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="profile-privacy-note text-xs leading-5 text-slate-400"><ShieldCheck className="size-7 shrink-0" /><span>Your nickname and avatar are visible to other users in the game leaderboard.<br />Your email stays private.</span></p>
          <Button type="submit" disabled={loading || saving || !hasChanges}>
            {saving ? <><Camera size={16} /> Saving…</> : <><Check size={16} /> Save profile</>}
          </Button>
        </div>
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
