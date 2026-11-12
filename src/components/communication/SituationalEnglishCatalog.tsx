"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, BriefcaseBusiness, BusFront, CalendarDays, GraduationCap, Headphones, HeartPulse, House, Luggage, ShieldAlert, ShoppingBag, Smartphone, Utensils, UsersRound, Volleyball, CloudSun, Landmark, PartyPopper, type LucideIcon } from "lucide-react";
import { CommunicationCatalogHeader } from "@/components/communication/CommunicationCatalogHeader";
import { DueReviewPanel } from "@/components/communication/DueReviewPanel";
import { LearningGoalPanel } from "@/components/communication/LearningGoalPanel";
import { SituationCard } from "@/components/communication/SituationCard";
import { SituationFilters } from "@/components/communication/SituationFilters";
import { useSituationalEnglishCatalogData } from "@/hooks/useSituationalEnglishCatalogData";
import { useSituationalEnglishCatalogView } from "@/hooks/useSituationalEnglishCatalogView";
import { getCatalogRecommendation } from "@/lib/communication/catalog-recommendation";

const topicIcons: Record<string, LucideIcon> = {
  "greetings-introductions": UsersRound, "family-friends": UsersRound, "daily-routines": CalendarDays,
  "work-colleagues": BriefcaseBusiness, "food-restaurants": Utensils, "shopping-payments": ShoppingBag,
  "transport-directions": BusFront, "travel-hotels": Luggage, "health-feelings": HeartPulse,
  "hobbies-free-time": Volleyball, "time-appointments": CalendarDays, "phone-online": Smartphone,
  "education-classes": GraduationCap, "home-neighborhood": House, "weather-seasons": CloudSun,
  "money-banking": Landmark, "plans-invitations": PartyPopper, "customer-service": Headphones,
  "emergencies-safety": ShieldAlert, "technology-devices": Smartphone,
};
const topicAccents = [
  "border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 text-blue-700",
  "border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-700",
  "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700",
  "border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-700",
  "border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 text-rose-700",
  "border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700",
];
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
      {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/></div> : visibleTopics.length === 0 ? <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={32}/><p className="mt-3 font-bold text-slate-800">No published lessons yet</p><p className="mt-1 text-sm text-slate-500">New lessons will appear here after an admin publishes them.</p></div> : <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleTopics.map((topic, index) => <SituationCard
        key={topic.id}
        topic={topic}
        lessons={visibleLessonsByTopic.get(topic.id) ?? []}
        progressByLesson={progressByLesson}
        completedLevels={completedLevelsByTopic.get(topic.id) ?? new Set()}
        authenticated={authenticated}
        accent={topicAccents[index % topicAccents.length]}
        TopicIcon={topicIcons[topic.slug]}
      />)}</div>}
    </section>
  </main>;
}
