import { Check, Gamepad2, Headphones, Target } from "lucide-react";

import { Select } from "@/components/ui/Select";
import type { Goal } from "@/hooks/useSituationalEnglishCatalogData";

type LearningGoalPanelProps = {
  goal: Goal | null;
  dailyGoal: number;
  todayCompleted: number;
  savingPreference: boolean;
  onSaveGoal: (goal: Goal) => void;
  onSaveDailyGoal: (goal: number) => void;
};

export function LearningGoalPanel({
  goal,
  dailyGoal,
  todayCompleted,
  savingPreference,
  onSaveGoal,
  onSaveDailyGoal,
}: LearningGoalPanelProps) {
  const dailyProgress = Math.min(100, (todayCompleted / dailyGoal) * 100);

  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700"><Target size={22} /></span>
          <div><h2 className="text-lg font-extrabold text-slate-900">Your learning goal</h2><p className="text-sm text-slate-600">Choose a path. You can change it anytime.</p></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" disabled={savingPreference} onClick={() => onSaveGoal("games")} aria-pressed={goal === "games"} className={`rounded-2xl border p-3 text-left transition ${goal === "games" ? "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Gamepad2 size={20} className="text-blue-600" /> Learn through games</span>
            <span className="mt-1 block pl-7 text-sm leading-snug text-slate-600">Build vocabulary through quick play and recall.</span>
          </button>
          <button type="button" disabled={savingPreference} onClick={() => onSaveGoal("conversation")} aria-pressed={goal === "conversation"} className={`rounded-2xl border p-3 text-left transition ${goal === "conversation" ? "border-violet-400 bg-violet-50 shadow-sm ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-200"}`}>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Headphones size={20} className="text-violet-700" /> Speak everyday English</span>
            <span className="mt-1 block pl-7 text-sm leading-snug text-slate-600">Learn practical phrases and short conversations.</span>
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={22} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2"><h2 className="font-extrabold text-slate-900">Today&apos;s practice</h2><span className="text-xs text-slate-500">{todayCompleted} of {dailyGoal} lessons completed</span></div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${dailyProgress}%` }} /></div>
          </div>
        </div>
        <label className="mt-3 block text-xs font-bold text-slate-600">Daily lesson goal
          <Select aria-label="Daily lesson goal" className="!mt-1 !h-10 !rounded-xl !border-emerald-200" value={dailyGoal} onChange={(event) => onSaveDailyGoal(Number(event.target.value))}>
            {[1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value} {value === 1 ? "lesson" : "lessons"} per day</option>)}
          </Select>
        </label>
      </div>
    </section>
  );
}
