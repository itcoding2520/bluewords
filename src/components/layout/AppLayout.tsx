
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F7F8FA]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="min-w-0 flex-1 px-4 pb-6 pt-30 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
