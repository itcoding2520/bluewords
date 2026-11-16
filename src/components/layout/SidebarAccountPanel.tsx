import Link from "next/link";
import { LogOut } from "lucide-react";

import { UserAvatar } from "@/components/user/UserAvatar";
import { logout } from "@/app/login/actions";
import type { UserProfile } from "@/lib/supabase/user-profile";

export function SidebarAccountPanel({
  email,
  isAuthenticated,
  profile,
  onNavigate,
}: {
  email: string | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-auto pt-4">
      {!isAuthenticated ? (
        <Link href="/login" prefetch={false} onClick={onNavigate} className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
          Log in
        </Link>
      ) : (
        <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 shadow-[0_8px_22px_rgb(39_90_150/0.08)]">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/profile" onClick={onNavigate} className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500" aria-label="Open profile">
              <UserAvatar nickname={profile?.nickname} email={email} avatarPath={profile?.avatar_path} sizeClassName="size-11 text-sm ring-2 ring-blue-100" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">Hello, {profile?.nickname || email || "..."} 👋</p>
              <Link href="/profile" prefetch={false} onClick={onNavigate} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Manage profile
              </Link>
            </div>
          </div>

          <form action={logout}>
            <button type="submit" className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border-t border-slate-100 px-2 pt-3 text-sm font-medium text-slate-500 transition-colors hover:text-red-600">
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
