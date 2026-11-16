import { Star } from "lucide-react";
import type { VocabularyStatus } from "@/data/vocabulary";

export function FlashcardStatusFilter({
  status,
  statusCounts,
  onStatusChange,
}: {
  status: VocabularyStatus;
  statusCounts: Record<VocabularyStatus, number>;
  onStatusChange: (status: VocabularyStatus) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-indigo-950">Vocabulary status</legend>
      <div className="flashcards-status-switch grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          aria-pressed={status === "learning"}
          onClick={() => onStatusChange("learning")}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${status === "learning" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <span className="inline-flex items-center gap-1.5"><Star size={15} fill="currentColor" />Learning</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${status === "learning" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
            {statusCounts.learning}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={status === "mastered"}
          onClick={() => onStatusChange("mastered")}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${status === "mastered" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
        >
          <span className="inline-flex items-center gap-1.5"><Star size={15} />Mastered</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${status === "mastered" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
            {statusCounts.mastered}
          </span>
        </button>
      </div>
    </fieldset>
  );
}
