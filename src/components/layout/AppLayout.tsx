import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F7F8FA]">
      <div className="flex min-h-screen">
        <Sidebar />

        <section className="flex-1 px-10 py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </section>
      </div>
    </main>
  );
}