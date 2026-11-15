
"use client";

import { useState } from "react";
import {
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SidebarAccountPanel } from "@/components/layout/SidebarAccountPanel";
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
        
        <SidebarAccountPanel email={email} isAuthenticated={isAuthenticated} profile={profile} onNavigate={closeSidebar} />
      </aside>
    </>
  );
}
