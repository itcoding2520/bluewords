"use client";

import Link from "next/link";
import { useState } from "react";
import { CommunicationCatalogHeader } from "@/components/communication/CommunicationCatalogHeader";
import { DueReviewPanel } from "@/components/communication/DueReviewPanel";
import { LearningGoalPanel } from "@/components/communication/LearningGoalPanel";
import { SituationFilters } from "@/components/communication/SituationFilters";
import { SituationResults } from "@/components/communication/SituationResults";
import { useSituationalEnglishCatalogData } from "@/hooks/useSituationalEnglishCatalogData";
import { useSituationalEnglishCatalogView } from "@/hooks/useSituationalEnglishCatalogView";
import { getCatalogRecommendation } from "@/lib/communication/catalog-recommendation";

let savedDifficulty = "all";
let savedSearch = "";

export function SituationalEnglishCatalog() {
  const {
    topics,
    lessons,
    progress,
    lessonAccuracy,
    goal,
    dailyGoal,
    todayCompleted,
    dueItems,
    loading,
    authenticated,
    savingPreference,
    saveGoal,
    saveDailyGoal,
  } = useSituationalEnglishCatalogData();
  const [difficulty, setDifficulty] = useState(savedDifficulty);
  const [search, setSearch] = useState(savedSearch);

  const { visibleTopics, visibleLessonsByTopic, progressByLesson, completedLevelsByTopic } = useSituationalEnglishCatalogView({
    topics,
    lessons,
    progress,
    difficulty,
    search,
  });
  const { nextStepHref, nextStepLabel, nextStepReason } = getCatalogRecommendation({
    lessons,
    progress,
    lessonAccuracy,
    dueItems,
  });

  return <main className="space-y-4 sm:space-y-5">
    <CommunicationCatalogHeader authenticated={authenticated} nextStepHref={nextStepHref} nextStepLabel={nextStepLabel} nextStepReason={nextStepReason} />

    {!authenticated && <aside className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">You can explore published lessons. Sign in to choose a goal, save daily progress, and review items. <Link className="ml-1 font-bold underline" href="/login">Log in</Link></aside>}

    {authenticated && <LearningGoalPanel
      goal={goal}
      dailyGoal={dailyGoal}
      todayCompleted={todayCompleted}
      savingPreference={savingPreference}
      onSaveGoal={(nextGoal) => void saveGoal(nextGoal)}
      onSaveDailyGoal={(nextGoal) => void saveDailyGoal(nextGoal)}
    />}

    {authenticated && <DueReviewPanel items={dueItems} />}

    <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-extrabold text-slate-900">Choose a situation</h2><p className="mt-0.5 text-sm text-slate-500">Start with a practical topic and choose the level that suits you.</p></div><span className="text-sm font-medium text-slate-500">{visibleTopics.length} situations</span></div>
      <SituationFilters
        search={search}
        difficulty={difficulty}
        onSearchChange={(value) => { savedSearch = value; setSearch(value); }}
        onDifficultyChange={(value) => { savedDifficulty = value; setDifficulty(value); }}
      />
      <SituationResults
        loading={loading}
        authenticated={authenticated}
        topics={visibleTopics}
        visibleLessonsByTopic={visibleLessonsByTopic}
        progressByLesson={progressByLesson}
        completedLevelsByTopic={completedLevelsByTopic}
      />
    </section>
  </main>;
}
