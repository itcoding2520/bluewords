"use client";

import { useEffect, useState } from "react";
import { Camera, Check, ImagePlus, Trash2, UserRound } from "lucide-react";

import { UserAvatar } from "@/components/user/UserAvatar";
import { Button } from "@/components/ui/Button";
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
    <div className="mx-auto max-w-3xl">
      <header className="mb-7">
        <p className="text-sm font-medium text-blue-600">Your account</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Profile</h1>
        <p className="mt-2 text-sm text-slate-500">Choose how you appear in BlueWords and on game leaderboards.</p>
      </header>

      <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex justify-center sm:justify-start">
            {previewUrl ? (
              <span role="img" aria-label="New avatar preview" className="size-28 rounded-full bg-cover bg-center ring-4 ring-blue-50" style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }} />
            ) : (
              <UserAvatar
                nickname={normalizedNickname || profile?.nickname}
                email={email}
                fallbackName="User"
                avatarPath={previewPath}
                sizeClassName="size-28 text-3xl ring-4 ring-blue-50"
              />
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-base font-semibold text-slate-900">Profile picture</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">If you skip the image, we’ll use the first letter of your nickname or email.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                <ImagePlus size={16} /> {avatarFile || profile?.avatar_path ? "Change image" : "Upload image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={loading || saving} onChange={(event) => { handleAvatarChange(event.target.files?.[0]); event.currentTarget.value = ""; }} />
              </label>
              {(avatarFile || (profile?.avatar_path && !removeAvatar)) && (
                <button type="button" onClick={() => { setAvatarFile(null); setPreviewUrl(null); setRemoveAvatar(Boolean(profile?.avatar_path)); setError(""); setNotice(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-red-600 transition hover:bg-red-50">
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

        <div className="my-7 border-t border-slate-100" />

        <div className="space-y-5">
          <div>
            <label htmlFor="profile-nickname" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"><UserRound size={16} /> Nickname</label>
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

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Account email</p>
            <p className="mt-1 break-all text-sm text-slate-700">{email ?? "Unavailable"}</p>
          </div>
        </div>

        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><Check size={16} /> {notice}</p>}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">Your nickname and avatar are visible to other users in the game leaderboard. Your email stays private.</p>
          <Button type="submit" disabled={loading || saving || !hasChanges}>
            {saving ? <><Camera size={16} /> Saving…</> : <><Check size={16} /> Save profile</>}
          </Button>
        </div>
      </form>
    </div>
  );
}
