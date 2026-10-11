import { BookOpen, LayoutDashboard, Library } from "lucide-react";
import Link from "next/link";

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white p-6">
      <div className="mb-10">
        <div className="flex items-center gap-2">
          <BookOpen className="text-blue-600" size={22} />

          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Blue<span className="text-blue-600">Words</span>
          </h1>
        </div>

        <p className="mt-1 text-xs text-slate-400">
          Learn a little every day.
        </p>
      </div>

      <nav className="space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <LayoutDashboard size={18} />
          Overview
        </Link>

        <Link
          href="/vocabulary"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          <Library size={18} />
          Vocabulary
        </Link>
      </nav>
    </aside>
  );
}