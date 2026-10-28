
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Library,
  BookOpenCheck,
  History,
  ClipboardCheck,
  Gamepad2,
  Clapperboard,
  Menu,
  X,
  LogOut,
  UserRound,
  Bell,
  ShieldCheck,
  Send,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

import { cn } from "@/lib/cn";
import Image from "next/image";
import { UserAvatar } from "@/components/user/UserAvatar";
import {
  getCachedUserProfile,
  getUserProfile,
  USER_PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/supabase/user-profile";

const navigation = [
  {
    label: "Profile",
    href: "/profile",
    icon: UserRound,
  },
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Vocabulary",
    href: "/vocabulary",
    icon: Library,
  },
  {
    label: "Flashcards",
    href: "/flashcards",
    icon: BookOpenCheck,
  },
  {
    label: "Games",
    href: "/games",
    icon: Gamepad2,
  },
  { label: "Assignments", href: "/assignments", icon: ClipboardCheck },
  {
    label: "Videos",
    href: "/videos",
    icon: Clapperboard,
  },
  {
    label: "Review results",
    href: "/reviews",
    icon: History,
  },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Publish vocabulary", href: "/publish", icon: Send },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
];

const navigationArtwork: Record<string, string> = {
  "/profile": "/images/ui/icons/profile.svg",
  "/vocabulary": "/images/ui/icons/vocabulary.svg",
  "/flashcards": "/images/ui/icons/flashcards.svg",
  "/games": "/images/ui/icons/games.svg",
  "/videos": "/images/ui/icons/videos.svg",
  "/reviews": "/images/ui/icons/review-results.svg",
  "/notifications": "/images/ui/icons/notifications.svg",
  "/publish": "/images/ui/icons/publish.svg",
};

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [pendingAssignmentCount, setPendingAssignmentCount] = useState(0);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    async function loadProfile(userId: string) {
      currentUserId = userId;
      const cachedProfile = getCachedUserProfile(userId);
      if (active && cachedProfile !== undefined) setProfile(cachedProfile);
      try {
        const nextProfile = await getUserProfile(userId);
        if (active && currentUserId === userId) setProfile(nextProfile);
      } catch (profileError) {
        console.error("Failed to load user profile:", profileError);
        // Keep the cached avatar/profile visible if the network is temporarily unavailable.
      }
    }

    // Lấy session hiện tại để hiển thị email.
    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Failed to load session:", error);
        return;
      }

      setEmail(session?.user.email ?? null);
      setIsAuthenticated(Boolean(session?.user.id));
      setAuthUserId(session?.user.id ?? null);
      if (session?.user.id) {
        setIsAdminChecked(false);
        const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", session.user.id).maybeSingle();
        if (active) {
          setIsAdmin(Boolean(admin));
          setIsAdminChecked(true);
        }
      } else {
        setIsAdmin(false);
        setIsAdminChecked(true);
      }
      if (session?.user.id) void loadProfile(session.user.id);
      else {
        currentUserId = null;
        setProfile(null);
      }
    }

    void loadSession();

    // Cập nhật email khi auth thay đổi.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setEmail(session?.user.email ?? null);
        setIsAuthenticated(Boolean(session?.user.id));
        setAuthUserId(session?.user.id ?? null);
        setIsAdmin(false);
        setIsAdminChecked(!session?.user.id);
        if (session?.user.id) {
          const userId = session.user.id;
          void supabase.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle().then(({ data: admin }) => {
            if (active) {
              setIsAdmin(Boolean(admin));
              setIsAdminChecked(true);
            }
          });
        }
        if (session?.user.id) void loadProfile(session.user.id);
        else {
          currentUserId = null;
          setProfile(null);
        }
      }
    );

    function handleProfileUpdated(event: Event) {
      setProfile((event as CustomEvent<UserProfile>).detail);
    }

    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [supabase]);

  useEffect(() => {
    if (!isAuthenticated || !authUserId) {
      return;
    }

    let active = true;
    async function refreshUnreadCount() {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", authUserId)
        .neq("kind", "assessment_assigned")
        .is("read_at", null);
      if (active && !error) setUnreadNotificationCount(count ?? 0);
    }

    const timer = window.setInterval(() => { void refreshUnreadCount(); }, 30_000);
    const handleNotificationsUpdated = () => { void refreshUnreadCount(); };
    window.addEventListener("bluewords:notifications-updated", handleNotificationsUpdated);
    void refreshUnreadCount();
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("bluewords:notifications-updated", handleNotificationsUpdated);
    };
  }, [authUserId, isAuthenticated, supabase]);

  useEffect(() => {
    if (!isAuthenticated || !authUserId) {
      const resetTimer = window.setTimeout(() => setPendingAssignmentCount(0), 0);
      return () => window.clearTimeout(resetTimer);
    }
    let active = true;
    async function refreshAssignments() {
      try {
        const response = await fetch("/api/assessments", { cache: "no-store" });
        const payload = await response.json();
        if (active && response.ok) setPendingAssignmentCount((payload.assignments ?? []).filter((item: { status: string }) => item.status !== "completed").length);
      } catch { /* Keep the last known badge count while offline. */ }
    }
    void refreshAssignments();
    const timer = window.setInterval(() => { void refreshAssignments(); }, 60_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [authUserId, isAuthenticated]);

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

        <nav aria-label="Main navigation" className="space-y-2">
          {navigation.filter((item) => {
            if (item.href === "/admin") return isAuthenticated && isAdmin;
            if (item.href === "/videos") return isAuthenticated;
            if (item.href === "/notifications") return isAuthenticated;
            if (item.href === "/assignments") return isAuthenticated && isAdminChecked && !isAdmin;
            if (item.href === "/publish") return isAuthenticated && !isAdmin;
            return isAuthenticated || !["/profile", "/reviews"].includes(item.href);
          }).map((item) => {
            const Icon = item.icon;
            const isGamesRoute = item.href === "/games" &&
              (pathname === "/quiz" || pathname.startsWith("/quiz/"));
            const isActive = isGamesRoute || (item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`));
            const visibleUnreadCount = isAuthenticated ? unreadNotificationCount : 0;
            const hasUnreadNotifications = item.href === "/notifications" && visibleUnreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={closeSidebar}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.href === "/notifications" && visibleUnreadCount > 0 ? `${item.label}, ${visibleUnreadCount} unread` : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl border px-3.5 py-3 text-[14px] font-semibold transition sm:min-h-[52px] sm:px-4 sm:text-[15px]",
                  isActive
                    ? "ui-art-background border-transparent bg-blue-50 bg-[url('/images/ui/backgrounds/nav-active.svg')] text-blue-800 shadow-[0_5px_16px_rgb(37_140_240/0.10)]"
                    : hasUnreadNotifications
                      ? "border-blue-100 bg-blue-50 text-blue-600"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {navigationArtwork[item.href] ? (
                  <Image src={navigationArtwork[item.href]} alt="" width={27} height={27} className="size-[25px] shrink-0 sm:size-7" />
                ) : (
                  <Icon size={23} strokeWidth={2} />
                )}
                <span className="min-w-0 flex-1">{item.label}</span>
                {item.href === "/notifications" && visibleUnreadCount > 0 && <span className="min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-4 text-white">{visibleUnreadCount > 99 ? "99+" : visibleUnreadCount}</span>}
                {item.href === "/assignments" && pendingAssignmentCount > 0 && <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-4 text-white">{pendingAssignmentCount > 99 ? "99+" : pendingAssignmentCount}</span>}
              </Link>
            );
          })}
          
        </nav>
        
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
