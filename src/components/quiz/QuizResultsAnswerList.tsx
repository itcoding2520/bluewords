import { expectedAnswer } from "@/lib/quiz-answer-model";
import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";

export function QuizResultsAnswerList({
  questions,
  answers,
  mode,
}: {
  questions: QuizQuestion[];
  answers: Record<number, QuizAnswer>;
  mode: QuizMode;
}) {
  return (
    <div className="mt-7 flex flex-col gap-3">
      {questions.map((question, index) => {
        const answer = answers[index];
        const expected = expectedAnswer(question, mode);
        const prompt = mode === "choose-meaning" && question.choiceType === "word" ? question.meaning : question.word.word;

        return (
          <div key={`${question.word.id}-${index}`} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{prompt}</p>
              {mode === "choose-meaning" && <p className="mt-1 text-sm text-slate-600">Correct answer: {expected}</p>}
              {!answer ? <p className="mt-1 text-xs text-slate-400">Not answered</p> : !answer.correct ? <p className="mt-1 text-xs text-red-600">Your answer: {answer.value}</p> : null}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${answer?.correct ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {answer?.correct ? "Correct" : "Review"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
