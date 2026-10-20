import Link from "next/link";
import { ArrowRight, Brain, Gamepad2, Grid3X3 } from "lucide-react";

import { Card } from "@/components/ui/Card";

const games = [
  {
    title: "Word Search",
    description: "Find your vocabulary hidden across a letter grid.",
    href: "/games/word-search",
    icon: Grid3X3,
    label: "New game",
    color: "bg-violet-50 text-violet-700",
  },
  {
    title: "Vocabulary Quiz",
    description: "Practice meanings or recall words from images.",
    href: "/quiz",
    icon: Brain,
    label: "Play quiz",
    color: "bg-blue-50 text-blue-700",
  },
];

export function GamesContent() {
  return (
    <div>
      <header className="mb-7">
        <p className="text-sm font-medium text-blue-600">Practice through play</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Games</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a quick game to strengthen your vocabulary.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {games.map(({ title, description, href, icon: Icon, label, color }) => (
          <Link key={title} href={href} className="group rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500">
            <Card className="flex h-full min-h-52 flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:border-blue-200 group-hover:shadow-md sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid size-12 place-items-center rounded-2xl ${color}`}><Icon size={23} /></span>
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">{label}</span>
              </div>
              <div className="mt-5 flex flex-1 items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
                </div>
                <ArrowRight size={19} className="mb-1 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-sm text-slate-500">
        <Gamepad2 size={19} className="shrink-0 text-slate-400" />
        <p>More vocabulary games will appear here as they become available.</p>
      </div>
    </div>
  );
}
