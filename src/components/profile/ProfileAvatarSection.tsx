"use client";

import { ImagePlus, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";

export function ProfileAvatarSection({
  nickname,
  savedNickname,
  email,
  previewUrl,
  previewPath,
  hasSelectedImage,
  hasSavedImage,
  isRemovingImage,
  disabled,
  onSelectImage,
  onRemoveImage,
  onUndoRemoval,
}: {
  nickname: string;
  savedNickname?: string | null;
  email: string | null;
  previewUrl: string | null;
  previewPath?: string | null;
  hasSelectedImage: boolean;
  hasSavedImage: boolean;
  isRemovingImage: boolean;
  disabled: boolean;
  onSelectImage: (file?: File) => void;
  onRemoveImage: () => void;
  onUndoRemoval: () => void;
}) {
  return (
    <div className="profile-avatar-section flex flex-col gap-6 sm:flex-row sm:items-center">
      <div className="profile-avatar-display flex justify-center sm:justify-start">
        {previewUrl ? (
          <span role="img" aria-label="New avatar preview" className="profile-avatar-preview size-40 rounded-full bg-cover bg-center ring-4 ring-blue-50" style={{ backgroundImage: `url(${JSON.stringify(previewUrl)})` }} />
        ) : (
          <UserAvatar
            nickname={nickname || savedNickname}
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
            <ImagePlus size={16} /> {hasSelectedImage || hasSavedImage ? "Change image" : "Upload image"}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={disabled} onChange={(event) => { onSelectImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          </label>
          {(hasSelectedImage || (hasSavedImage && !isRemovingImage)) && (
            <button type="button" onClick={onRemoveImage} className="profile-avatar-remove inline-flex min-h-12 items-center gap-2 rounded-xl px-4 text-base font-bold text-red-600 transition hover:bg-red-50">
              <Trash2 size={15} /> Remove image
            </button>
          )}
          {isRemovingImage && hasSavedImage && !hasSelectedImage && (
            <button type="button" onClick={onUndoRemoval} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              Undo
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">JPEG, PNG, or WebP · maximum 5 MB · shown publicly on leaderboards.</p>
      </div>
    </div>
  );
}
