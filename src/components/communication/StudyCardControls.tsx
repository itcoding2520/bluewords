import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import type { LearningStatus } from "@/types/learning";

export function StudyCardControls({
  index,
  itemCount,
  revealed,
  status,
  saving,
  onStatusChange,
  onPrevious,
  onNext,
}: {
  index: number;
  itemCount: number;
  revealed: boolean;
  status: LearningStatus;
  saving: boolean;
  onStatusChange: (status: LearningStatus) => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <>
      {revealed && (
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button type="button" disabled={saving} onClick={() => onStatusChange("learning")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${status === "learning" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600"}`}><RotateCcw size={16}/> Learning</button>
          <button type="button" disabled={saving} onClick={() => onStatusChange("mastered")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${status === "mastered" ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><Check size={16}/> Mastered</button>
        </div>
      )}
      <div className="mt-5 flex items-center justify-center gap-3">
        <button type="button" disabled={index === 0} onClick={onPrevious} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-200 px-5 text-sm font-bold text-blue-700 disabled:opacity-40"><ArrowLeft size={16}/> Previous</button>
        <button type="button" disabled={index >= itemCount - 1} onClick={onNext} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-40">Next item <ArrowRight size={16}/></button>
      </div>
    </>
  );
}
