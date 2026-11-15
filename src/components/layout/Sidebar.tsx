
"use client";

import { useState } from "react";
import {
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { UserAvatar } from "@/components/user/UserAvatar";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { useSidebarAccount } from "@/hooks/useSidebarAccount";
import { useSidebarNotificationCount } from "@/hooks/useSidebarNotificationCount";
import { useSidebarPendingAssignments } from "@/hooks/useSidebarPendingAssignments";

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { email, isAuthenticated, authUserId, isAdmin, isAdminChecked, profile } = useSidebarAccount();
  const unreadNotificationCount = useSidebarNotificationCount(authUserId, isAuthenticated);
  const pendingAssignmentCount = useSidebarPendingAssignments(authUserId, isAuthenticated);

  function closeSidebar() {
    setIsOpen(false);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex min-h-20 items-center justify-between border-b border-sky-100 bg-white/95 px-4 shadow-sm backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2" aria-label="BlueWords home">
          <Image src="/logo.webp" alt="BlueWords" width={190} height={68} sizes="190px" loading="eager" className="h-14 w-40 object-contain" />
        </Link>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="bluewords-sidebar"
          className="cursor-pointer flex size-10 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          onClick={closeSidebar}
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Desktop sidebar + mobile drawer */}
      <aside
        id="bluewords-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col border-r border-sky-100 bg-gradient-to-b from-white via-white to-sky-50/70 p-4 shadow-[8px_0_28px_rgb(36_111_188/0.06)] transition-transform duration-300 sm:p-5",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-7 flex shrink-0 items-center justify-between gap-2">
            <Link
              href="/"
              prefetch={false}
              onClick={closeSidebar}
              aria-label="BlueWords home"
              className="flex min-w-0 items-center gap-2"
            >
              <Image src="/logo.webp" alt="BlueWords" width={190} height={68} sizes="190px" loading="eager" className="h-[68px] w-[190px] object-contain" />
            </Link>

          <button
            type="button"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
            className="flex size-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <SidebarNavigation
          pathname={pathname}
          isAuthenticated={isAuthenticated}
          isAdmin={isAdmin}
          isAdminChecked={isAdminChecked}
          unreadNotificationCount={unreadNotificationCount}
          pendingAssignmentCount={pendingAssignmentCount}
          onNavigate={closeSidebar}
        />
        
        <div className="mt-auto pt-4">
          {!isAuthenticated ? <Link href="/login" prefetch={false} onClick={closeSidebar} className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">Log in</Link> : <div className="rounded-2xl border border-sky-100 bg-white/90 p-3 shadow-[0_8px_22px_rgb(39_90_150/0.08)]">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/profile" onClick={closeSidebar} className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500" aria-label="Open profile">
              <UserAvatar nickname={profile?.nickname} email={email} avatarPath={profile?.avatar_path} sizeClassName="size-11 text-sm ring-2 ring-blue-100" />
            </Link>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                Hello, {profile?.nickname || email || "..."} 👋
              </p>
              <Link href="/profile" prefetch={false} onClick={closeSidebar} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Manage profile</Link>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border-t border-slate-100 px-2 pt-3 text-sm font-medium text-slate-500 transition-colors hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </form>
          </div>}
        </div>
      </aside>
    </>
  );
}
