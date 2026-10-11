import Link from "next/link";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  dateLabel: string;
  greeting: string;
}

export function DashboardHeader({
  dateLabel,
  greeting,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-blue-600">
          {dateLabel}
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {greeting} 👋
        </h1>

        <p className="mt-2 text-slate-500">
          Small progress is still progress. Keep going.
        </p>
      </div>

      <Link
        href="/vocabulary"
        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Plus size={17} />
        Add word
      </Link>
    </header>
  );
}