import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";

import type { ReviewItem } from "@/hooks/useSituationalEnglishCatalogData";

export function DueReviewPanel({ items }: { items: ReviewItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock3 size={22} /></span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Ready to review</h2>
            <p className="text-sm text-slate-600">{items.length} {items.length === 1 ? "item is" : "items are"} due for practice.</p>
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {items.slice(0, 9).map((item) => (
          <Link
            key={item.item_id}
            href={`/communication/${item.lesson_id}?reviewItem=${encodeURIComponent(item.item_id)}`}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3 hover:border-amber-300"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-slate-900">{item.content_en}</span>
              <span className="block truncate text-xs text-slate-500">{item.meaning_vi} · {item.lesson_title_en}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-amber-600" />
          </Link>
        ))}
      </div>
    </section>
  );
}
