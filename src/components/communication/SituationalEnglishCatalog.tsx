"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, BusFront, CalendarDays, FileText, GraduationCap, Headphones, HeartPulse, House, Luggage, MessageCircle, Search, ShieldAlert, ShoppingBag, Smartphone, Sparkles, Utensils, UsersRound, Volleyball, CloudSun, Landmark, PartyPopper, type LucideIcon } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { DueReviewPanel } from "@/components/communication/DueReviewPanel";
import { LearningGoalPanel } from "@/components/communication/LearningGoalPanel";
import { SituationCard } from "@/components/communication/SituationCard";
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
    <header className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 shadow-[0_14px_36px_rgb(37_99_235/0.08)] sm:p-7">
      <div className="relative z-10 max-w-4xl"><span className="text-sm font-bold text-blue-600">Everyday English · Tiếng Anh giao tiếp</span><h1 className="mt-1 text-3xl font-black tracking-tight text-[#102969] sm:text-4xl">Learn by situation</h1><p className="mt-1 text-sm text-slate-600 sm:text-base">Build useful words and practice real conversations for everyday life.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2"><div className="flex flex-wrap items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-slate-800 shadow-sm sm:gap-3 sm:px-4 sm:text-sm"><span className="inline-flex items-center gap-1.5"><BookOpen size={17} className="text-blue-600"/>Word</span><ArrowRight size={14} className="text-slate-400"/><span className="inline-flex items-center gap-1.5"><MessageCircle size={17} className="text-blue-600"/>Phrase</span><ArrowRight size={14} className="text-slate-400"/><span className="inline-flex items-center gap-1.5"><FileText size={17} className="text-blue-600"/>Sentence</span><ArrowRight size={14} className="text-slate-400"/><span className="inline-flex items-center gap-1.5"><UsersRound size={17} className="text-blue-600"/>Dialogue</span></div>{authenticated && nextStepHref && <Link href={nextStepHref} className="group inline-flex min-h-[3.75rem] max-w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl sm:px-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15"><ArrowRight size={18}/></span><span className="min-w-0 flex-1"><span className="block text-[10px] font-extrabold uppercase tracking-[.14em] text-blue-100">Next step</span><span className="block truncate text-sm font-extrabold leading-5">{nextStepLabel}</span><span className="block truncate text-xs leading-4 text-blue-100">{nextStepReason}</span></span></Link>}</div>
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 hidden size-56 place-items-center rounded-full bg-white/45 text-blue-300 sm:grid"><MessageCircle size={88}/><span className="absolute grid size-14 place-items-center rounded-full bg-white text-blue-500 shadow-sm"><span className="flex gap-1"><i className="size-2 rounded-full bg-blue-400"/><i className="size-2 rounded-full bg-blue-500"/><i className="size-2 rounded-full bg-blue-600"/></span></span><Sparkles className="absolute right-9 top-10 text-amber-400" size={24}/></div>
    </header>

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
      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input aria-label="Search situations" value={search} onChange={(e) => { savedSearch = e.target.value; setSearch(e.target.value); }} className="h-10 w-full rounded-xl border border-sky-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="Search situations…"/></label><Select aria-label="Filter lessons by difficulty" className="!h-10 !rounded-xl" value={difficulty} onChange={(e) => { savedDifficulty = e.target.value; setDifficulty(e.target.value); }}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></div>
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
