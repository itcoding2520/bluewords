import {
  LayoutDashboard,
  Library,
  BookOpenCheck,
  History,
  ClipboardCheck,
  MessageCircle,
  Gamepad2,
  Clapperboard,
  Bell,
  ShieldCheck,
  Send,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

type NavigationAudience = "public" | "member" | "learner" | "learner-after-role-check" | "admin";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  audience: NavigationAudience;
}

const navigation: NavigationItem[] = [
  { label: "Profile", href: "/profile", icon: UserRound, audience: "member" },
  { label: "Overview", href: "/", icon: LayoutDashboard, audience: "public" },
  { label: "Vocabulary", href: "/vocabulary", icon: Library, audience: "public" },
  { label: "Flashcards", href: "/flashcards", icon: BookOpenCheck, audience: "public" },
  { label: "Games", href: "/games", icon: Gamepad2, audience: "public" },
  { label: "Assignments", href: "/assignments", icon: ClipboardCheck, audience: "learner-after-role-check" },
  { label: "English practice", href: "/communication", icon: MessageCircle, audience: "public" },
  { label: "Videos", href: "/videos", icon: Clapperboard, audience: "member" },
  { label: "Review results", href: "/reviews", icon: History, audience: "member" },
  { label: "Notifications", href: "/notifications", icon: Bell, audience: "member" },
  { label: "Publish vocabulary", href: "/publish", icon: Send, audience: "learner" },
  { label: "Admin", href: "/admin", icon: ShieldCheck, audience: "admin" },
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

function canViewNavigationItem(
  audience: NavigationAudience,
  isAuthenticated: boolean,
  isAdmin: boolean,
  isAdminChecked: boolean,
) {
  switch (audience) {
    case "public": return true;
    case "member": return isAuthenticated;
    case "learner": return isAuthenticated && !isAdmin;
    case "learner-after-role-check": return isAuthenticated && isAdminChecked && !isAdmin;
    case "admin": return isAuthenticated && isAdmin;
  }
}

function isNavigationItemActive(href: string, pathname: string) {
  const isGamesRoute = href === "/games"
    && (pathname === "/quiz" || pathname.startsWith("/quiz/"));
  return isGamesRoute || (href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`));
}

function formatNavigationBadgeCount(count: number) {
  return count > 99 ? "99+" : count;
}

interface SidebarNavigationProps {
  pathname: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAdminChecked: boolean;
  unreadNotificationCount: number;
  pendingAssignmentCount: number;
  onNavigate: () => void;
}

export function SidebarNavigation({
  pathname,
  isAuthenticated,
  isAdmin,
  isAdminChecked,
  unreadNotificationCount,
  pendingAssignmentCount,
  onNavigate,
}: SidebarNavigationProps) {
  const visibleItems = navigation.filter((item) =>
    canViewNavigationItem(item.audience, isAuthenticated, isAdmin, isAdminChecked)
  );

  return (
    <nav aria-label="Main navigation" className="space-y-2">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const isActive = isNavigationItemActive(item.href, pathname);
        const visibleUnreadCount = isAuthenticated ? unreadNotificationCount : 0;
        const hasUnreadNotifications = item.href === "/notifications" && visibleUnreadCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={item.href === "/" ? true : false}
            onClick={onNavigate}
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
            {item.href === "/notifications" && visibleUnreadCount > 0 && <span className="min-w-5 rounded-full bg-blue-600 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-4 text-white">{formatNavigationBadgeCount(visibleUnreadCount)}</span>}
            {item.href === "/assignments" && pendingAssignmentCount > 0 && <span className="min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-4 text-white">{formatNavigationBadgeCount(pendingAssignmentCount)}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
