"use client";

import { useEffect, useState } from "react";
import { Camera, Check, ImagePlus, LockKeyhole, Mail, ShieldCheck, Star, Trash2, UserRound } from "lucide-react";

import { UserAvatar } from "@/components/user/UserAvatar";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import {
  deleteUserAvatar,
  getUserProfile,
  saveUserProfile,
  uploadUserAvatar,
  validateUserAvatar,
  type UserProfile,
} from "@/lib/supabase/user-profile";

interface UserProfileContentProps {
  userId: string;
  email: string | null;
}

export function UserProfileContent({ userId, email }: UserProfileContentProps) {
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

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
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

  function handleAvatarChange(file: File | undefined) {
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

  return (
    <div className="profile-page mx-auto max-w-5xl">
      <header className="profile-hero mb-6">
        <p className="text-sm font-medium text-blue-600">Your account</p>
        <h1 className="page-title mt-1">Profile <Star aria-hidden="true" className="inline size-6 fill-amber-400 text-amber-400" /></h1>
        <p className="page-intro-description mt-2">Choose how you appear in BlueWords and on game leaderboards.</p>
      </header>

      <form onSubmit={handleSave} className="profile-form rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
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
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={loading || saving} onChange={(event) => { handleAvatarChange(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              </label>
              {(avatarFile || (profile?.avatar_path && !removeAvatar)) && (
                <button type="button" onClick={() => { setAvatarFile(null); setPreviewUrl(null); setRemoveAvatar(Boolean(profile?.avatar_path)); setError(""); setNotice(""); }} className="profile-avatar-remove inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold text-red-600 transition hover:bg-red-50">
                  <Trash2 size={15} /> Remove image
                </button>
              )}
              {removeAvatar && profile?.avatar_path && !avatarFile && (
                <button type="button" onClick={() => setRemoveAvatar(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
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
              onChange={(event) => { setNickname(event.target.value); setError(""); setNotice(""); }}
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
    </div>
  );
}
