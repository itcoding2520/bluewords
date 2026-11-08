"use client";

import { Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { QuizPreviewQuestion } from "@/components/quiz/QuizPreviewQuestion";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { QUIZ_MODE_OPTIONS } from "@/lib/quiz-mode-model";

export function QuizPreview({
  mode,
  category,
  questionCount,
  meaningQuestion,
  typeWord,
}: {
  mode: QuizMode;
  category: string;
  questionCount: number;
  meaningQuestion?: QuizQuestion;
  typeWord?: VocabularyWord;
}) {
  const modeOption = QUIZ_MODE_OPTIONS[mode];
  const settings = [
    modeOption.compactLabel,
    category === "all" ? "All categories" : category,
    `${questionCount} questions`,
  ];

  return (
    <Card className="quiz-preview-card border-indigo-100 bg-indigo-50/70 p-5 sm:p-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Your quiz preview</p>
      <h2 className="quiz-preview-title mt-3 flex items-center gap-2 text-xl font-bold text-slate-900"><span>{modeOption.label}</span><Star aria-hidden="true" size={20} className="fill-amber-400 text-amber-400" /></h2>
      <p className="mt-1 text-sm text-slate-500">This is how a question will look.</p>

      <QuizPreviewQuestion mode={mode} meaningQuestion={meaningQuestion} typeWord={typeWord} />

      <div className="mt-5 border-t border-indigo-200/70 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Quiz settings</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {settings.map((setting) => <span key={setting} className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{setting}</span>)}
        </div>
        <p className="mt-5 text-xs text-slate-500">Questions are chosen from your vocabulary.</p>
      </div>
    </Card>
  );
}
