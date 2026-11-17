import type { Item } from "@/lib/communication/lesson-types";
import type { SentenceDrill } from "@/lib/communication/lesson-drills";
import { normalizeSentence } from "@/lib/communication/lesson-practice";

export function SentenceCompletionChoices({
  drill,
  answer,
  saving,
  onSubmit,
}: {
  drill: SentenceDrill<Item>;
  answer: string | null;
  saving: boolean;
  onSubmit: (answer: string) => void;
}) {
  const completeSentence = (choice: string) => (drill.gapSentence ?? "").replace("________", choice);

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {drill.choices?.map((choice) => {
        const choiceSentence = completeSentence(choice);
        const isSelected = answer !== null && normalizeSentence(answer) === normalizeSentence(choiceSentence);
        const isCorrectChoice = normalizeSentence(choice) === normalizeSentence(drill.answer);
        const stateClass = answer !== null && isCorrectChoice
          ? "border-emerald-400 bg-emerald-50 text-emerald-900"
          : isSelected ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 bg-white text-slate-800 hover:border-blue-300";
        return <button key={choice} type="button" disabled={answer !== null || saving} onClick={() => onSubmit(choiceSentence)} className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-sm font-bold ${stateClass}`}>{choice}</button>;
      })}
    </div>
  );
}
