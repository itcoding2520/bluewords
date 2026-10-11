import { ArrowRight } from "lucide-react";

interface WordRowProps {
  word: string;
  meaning: string;
  category: string;
}

export function WordRow({
  word,
  meaning,
  category,
}: WordRowProps) {
  return (
    <div className="flex items-center gap-6 border-b border-slate-100 px-6 py-5 last:border-none">
      <p className="w-40 font-semibold text-slate-900">
        {word}
      </p>

      <p className="flex-1 text-sm text-slate-500">
        {meaning}
      </p>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {category}
      </span>

      <button className="text-slate-400 transition hover:text-slate-900">
        <ArrowRight size={16} />
      </button>
    </div>
  );
}