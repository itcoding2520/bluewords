import { LockKeyhole, Mail, Star, UserRound } from "lucide-react";

export function ProfileAccountFields({
  nickname,
  email,
  disabled,
  onNicknameChange,
}: {
  nickname: string;
  email: string | null;
  disabled: boolean;
  onNicknameChange: (value: string) => void;
}) {
  return (
    <div className="profile-fields space-y-3">
      <div className="profile-nickname-field">
        <label htmlFor="profile-nickname" className="mb-2 flex items-center gap-2 text-base font-extrabold text-slate-800">
          <span className="profile-field-icon"><UserRound size={21} /></span>
          Nickname
          <Star aria-hidden="true" className="ml-auto size-5 fill-amber-400 text-amber-400" />
        </label>
        <input
          id="profile-nickname"
          value={nickname}
          onChange={(event) => onNicknameChange(event.target.value)}
          maxLength={24}
          minLength={2}
          autoComplete="nickname"
          placeholder="How should we call you?"
          className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          disabled={disabled}
        />
        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
          <span>Unique across BlueWords · 2–24 characters.</span>
          <span>{nickname.length}/24</span>
        </div>
      </div>

      <div className="profile-email-field rounded-xl bg-slate-50 p-4">
        <p className="flex items-center gap-2 text-base font-extrabold text-slate-800">
          <span className="profile-field-icon profile-email-icon"><Mail size={20} /></span>
          Account email
        </p>
        <p className="profile-email-value mt-2 flex items-center justify-between gap-3 break-all text-base text-slate-700">
          <span>{email ?? "Unavailable"}</span>
          <LockKeyhole className="size-5 shrink-0 text-slate-400" />
        </p>
      </div>
    </div>
  );
}
