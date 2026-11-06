"use client";

import Image from "next/image";
import { RotateCcw, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function QuizHistoryHeader({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  return (
    <div className="quiz-history-heading mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-950">
          Your quiz journey <Star aria-hidden="true" className="inline size-5 fill-amber-400 text-amber-400" />
        </h2>
        <p className="mt-1 text-sm text-slate-500">Review scores, time, and answers from every completed quiz.</p>
      </div>
      <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={240} height={150} className="quiz-history-art" />
      <Button variant="secondary" onClick={onRefresh} disabled={loading} className="quiz-history-refresh">
        <RotateCcw size={17} /> Refresh
      </Button>
    </div>
  );
}
