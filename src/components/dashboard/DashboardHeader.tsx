import Image from "next/image";
import type { ReactNode } from "react";
import { Sparkles, Sun } from "lucide-react";

interface DashboardHeaderProps {
  dateLabel: string;
  greeting: string;
  email?: string | null;
  nickname?: string | null;
  children: ReactNode;
}

export function DashboardHeader({
  dateLabel,
  greeting,
  email,
  nickname,
  children,
}: DashboardHeaderProps) {
  const displayName = nickname?.trim() || email;
  return (
    <header className="ui-art-background relative isolate overflow-hidden rounded-[2rem] border border-sky-100 bg-sky-100 p-5 shadow-[0_12px_36px_rgb(37_140_240/0.14)] sm:p-7 lg:p-8" style={{ backgroundImage: "url('/images/ui/backgrounds/hero.svg')" }}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/85 via-white/65 to-white/5" aria-hidden="true" />
      <div className="relative flex min-h-40 items-center justify-between gap-5 sm:min-h-44">
        <div className="min-w-0 max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm sm:text-sm">
            <Sun size={15} className="text-amber-500" />
            {dateLabel}
          </p>

          <h1 className="page-title mt-3">
            {greeting} <span className="text-blue-700">👋</span>
          </h1>

          {displayName && (
            <p className="mt-2 inline-flex max-w-full break-words items-center rounded-r-xl border-l-4 border-blue-500 bg-white/85 px-3 py-2 text-sm font-extrabold leading-snug text-blue-800 shadow-sm sm:text-base">
              Welcome back, {displayName}
            </p>
          )}

          <p className="page-intro-description page-intro-slogan mt-2 flex max-w-fit items-center gap-2 sm:mt-3">
            <Sparkles size={17} className="shrink-0 text-amber-500" aria-hidden="true" />
            <span>Every word you learn is a little win. Keep going!</span>
          </p>
        </div>

        <div aria-hidden="true" className="relative mr-2 hidden h-40 w-48 shrink-0 sm:block lg:h-48 lg:w-56">
          <span className="absolute right-0 top-1 text-amber-500"><Sparkles size={28} /></span>
          <span className="absolute left-1 top-5 text-amber-500"><Sun size={24} /></span>
          <Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" fill sizes="(max-width: 1024px) 192px, 224px" className="object-contain drop-shadow-[0_12px_12px_rgb(24_77_145/0.18)]" />
        </div>
      </div>

      <div className="relative mt-5 sm:mt-6">
        {children}
      </div>
    </header>
  );
}
