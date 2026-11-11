"use client";

export function AnswerChoiceList({
  choices,
  selectedAnswer,
  correctAnswer,
  disabled,
  onSelect,
}: {
  choices: string[];
  selectedAnswer: string | null;
  correctAnswer: string;
  disabled: boolean;
  onSelect: (answer: string) => void;
}) {
  return <div className="mt-4 grid gap-3 sm:grid-cols-2">{choices.map((choice) => {
    const isSelected = selectedAnswer === choice;
    const isCorrectChoice = choice === correctAnswer;
    const style = isSelected
      ? isCorrectChoice
        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
        : "border-rose-300 bg-rose-50 text-rose-900"
      : selectedAnswer !== null && isCorrectChoice
        ? "border-emerald-400 bg-emerald-50 text-emerald-900"
        : "border-slate-200 bg-white text-slate-800 hover:border-blue-300";

    return <button
      key={choice}
      type="button"
      disabled={disabled}
      onClick={() => onSelect(choice)}
      className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${style}`}
    >{choice}</button>;
  })}</div>;
}
