
"use client";

import type { CSSProperties, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const pageArtwork = [
    ["/vocabulary", "/images/ui/illustrations/vocabulary-books.svg"],
    ["/flashcards", "/images/ui/illustrations/flashcards-apple-cat.svg"],
    ["/games", "/images/ui/illustrations/game-controller.svg"],
    ["/quiz", "/images/ui/illustrations/game-controller.svg"],
    ["/videos", "/images/ui/illustrations/videos-penguin.svg"],
    ["/reviews", "/images/ui/illustrations/review-trophy.svg"],
    ["/notifications", "/images/ui/illustrations/notifications-envelope.svg"],
    ["/profile", "/images/ui/illustrations/profile-jenny.svg"],
    ["/publish", "/images/ui/illustrations/publish-globe-plane.svg"],
    ["/admin", "/images/ui/illustrations/activity-streak-puppy.svg"],
    ["/", "/images/ui/illustrations/hero-book-mascot.svg"],
  ].find(([path]) => path === "/" ? pathname === "/" : pathname.startsWith(path))?.[1];

  if (pathname === "/login" || pathname.startsWith("/auth/")) return children;

  return (
    <main className="app-shell min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 pb-6 pt-24 sm:px-6 lg:px-8 lg:py-7 xl:px-10">
          <div
            className="app-content mx-auto max-w-7xl"
            style={pageArtwork ? { "--page-art": `url('${pageArtwork}')` } as CSSProperties : undefined}
          >
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
