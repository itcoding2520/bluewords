import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/Card";

const guestActions = [
  {
    title: "Explore vocabulary",
    description: "Browse default words and community words approved for everyone.",
    href: "/vocabulary",
    icon: "/images/ui/icons/vocabulary.svg",
    illustration: "/images/ui/illustrations/vocabulary-books.svg",
    color: "bg-blue-50 text-blue-700",
    surface: "border-emerald-100 bg-[url('/images/ui/backgrounds/card-vocabulary.svg')]",
  },
  {
    title: "Practice with flashcards",
    description: "Review public vocabulary at your own pace.",
    href: "/flashcards",
    icon: "/images/ui/icons/flashcards.svg",
    illustration: "/images/ui/illustrations/flashcards-apple-cat.svg",
    color: "bg-emerald-50 text-emerald-700",
    surface: "border-pink-100 bg-[url('/images/ui/backgrounds/card-flashcards.svg')]",
  },
  {
    title: "Play a vocabulary game",
    description: "Try Word Search or Quiz using public words.",
    href: "/games",
    icon: "/images/ui/icons/games.svg",
    illustration: "/images/ui/illustrations/game-controller.svg",
    color: "bg-violet-50 text-violet-700",
    surface: "border-violet-100 bg-[url('/images/ui/backgrounds/card-games.svg')]",
  },
];

export function GuestHomeContent() {
  return (
    <div>
      <header className="mb-7">
        <p className="text-sm font-medium text-blue-600">Welcome to BlueWords</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Learn words, play, and explore</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">You can explore default and approved community vocabulary and use flashcards and games without an account. Sign in to manage your own words, keep game history, and join the leaderboards.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {guestActions.map(({ title, description, href, icon, illustration, color, surface }) => (
          <Link key={href} href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            <Card className={`ui-art-background relative flex h-full min-h-52 flex-col overflow-hidden border bg-white p-4 transition group-hover:-translate-y-0.5 group-hover:shadow-md sm:p-6 ${surface}`}>
              <Image src={illustration} alt="" width={150} height={130} sizes="(min-width: 640px) 120px, 96px" className="pointer-events-none absolute bottom-0 right-1 z-0 h-28 w-[43%] max-w-36 object-contain drop-shadow-sm sm:h-32" />
              <span className={`relative z-10 grid size-10 place-items-center rounded-xl ${color}`}><Image src={icon} alt="" width={27} height={27} /></span>
              <div className="relative z-10 mt-auto flex min-h-28 max-w-[60%] flex-1 flex-col justify-end">
                <h2 className="font-extrabold leading-tight text-slate-950">{title}</h2>
                <p className="mt-1 text-xs leading-4 text-slate-600 sm:text-sm sm:leading-5">{description}</p>
                <ArrowRight size={18} className="mt-2 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-700" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
