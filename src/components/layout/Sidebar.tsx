
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Library,
  BookOpenCheck,
  History,
  Gamepad2,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

import { cn } from "@/lib/cn";
import Image from "next/image";

const navigation = [
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
  {
    label: "Review results",
    href: "/reviews",
    icon: History,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

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
    }

    void loadSession();

    // Cập nhật email khi auth thay đổi.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        setEmail(session?.user.email ?? null);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function closeSidebar() {
    setIsOpen(false);
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex min-h-25 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Blue words" width={100} height={100} loading="eager"/>
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
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 transition-transform duration-300",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-10 flex items-start justify-center gap-2">
          <div>
            <Link
              href="/"
              onClick={closeSidebar}
              className="flex items-center gap-2"
            >
              <Image src="/logo.png" alt="Blue words" width={128} height={128} loading="eager"/>
            </Link>

            <p className="mt-1 text-xs text-slate-400">
              Learn a little every day.
            </p>
          </div>

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
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          
        </nav>
        
        <div className="mt-auto border-t border-slate-100 pt-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <span className="text-sm font-semibold">
                {email?.charAt(0).toUpperCase() ?? "U"}
              </span>
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                Hello 👋
              </p>
              <p
                className="truncate text-xs text-slate-500"
                title={email ?? undefined}
              >
                {email ?? "Loading account..."}
              </p>
            </div>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
