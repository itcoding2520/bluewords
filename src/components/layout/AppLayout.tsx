
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname.startsWith("/auth/")) return children;

  return (
    <main className="min-h-screen bg-[#F7F8FA]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 pb-6 pt-24 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
