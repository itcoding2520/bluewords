import { Card } from "@/components/ui/Card";
import { Sparkles, Target } from "lucide-react";

interface ProgressCardProps {
  total: number;
  mastered: number;
  progress: number;
}

export function ProgressCard({
  total,
  mastered,
  progress,
}: ProgressCardProps) {
  return (
    <Card className="ui-art-background h-full overflow-hidden border-blue-100 bg-white p-5 sm:p-6" style={{ backgroundImage: "url('/images/ui/backgrounds/progress.svg')" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700 ring-4 ring-white">
            <Target size={23} />
          </span>
          <div>
            <h2 className="font-bold text-slate-900 sm:text-lg">Your learning progress</h2>
            <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{mastered.toLocaleString()} of {total.toLocaleString()} words mastered</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div
          className="relative h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-blue-100/80 shadow-inner"
          role="progressbar"
          aria-label="Vocabulary learning progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
          {progress > 0 && <Sparkles aria-hidden="true" size={20} className="absolute top-1/2 -translate-y-1/2 text-amber-400 drop-shadow" style={{ left: `calc(${Math.min(progress, 96)}% - 10px)` }} />}
        </div>
        <span className="min-w-12 text-right text-xl font-extrabold text-blue-800 sm:text-2xl">{progress}%</span>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">
        {progress >= 100 ? "Amazing work! You mastered every word!" : "Keep practicing. Every word is a step forward!"}
      </p>
    </Card>
  );
}
