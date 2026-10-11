"use client";

import { useMemo } from "react";

import { useVocabulary } from "@/contexts/VocabularyContext";

import { DashboardHeader } from "./DashboardHeader";
import { Stats } from "./Stats";
import { ProgressCard } from "./ProgressCard";
import { RecentWords } from "./RecentWords";

interface DashboardContentProps {
  dateLabel: string;
  greeting: string;
}

export function DashboardContent({
  dateLabel,
  greeting,
}: DashboardContentProps) {
  const { words, isLoaded } = useVocabulary();

  const stats = useMemo(() => {
    const total = words.length;

    const mastered = words.filter(
      (word) => word.status === "mastered"
    ).length;

    const learning = total - mastered;

    const progress =
      total === 0
        ? 0
        : Math.round((mastered / total) * 100);

    return {
      total,
      mastered,
      learning,
      progress,
    };
  }, [words]);

  if (!isLoaded) {
    return (
      <div className="py-16 text-sm text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      <DashboardHeader dateLabel={dateLabel} greeting={greeting} />

      <Stats
        total={stats.total}
        learning={stats.learning}
        mastered={stats.mastered}
      />

      <ProgressCard
        total={stats.total}
        mastered={stats.mastered}
        progress={stats.progress}
      />

      <RecentWords words={words.slice(0, 3)} />
    </>
  );
}