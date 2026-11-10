"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, BriefcaseBusiness, BusFront, CalendarDays, Check, Clock3, FileText, Gamepad2, GraduationCap, Headphones, HeartPulse, House, Luggage, MessageCircle, Search, ShieldAlert, ShoppingBag, Smartphone, Sparkles, Target, Utensils, UsersRound, Volleyball, CloudSun, Landmark, PartyPopper, type LucideIcon } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { useSituationalEnglishCatalogData } from "@/hooks/useSituationalEnglishCatalogData";
import { getCatalogRecommendation } from "@/lib/communication/catalog-recommendation";

const difficultyLabel = { easy: "Easy · Dễ", medium: "Medium · Trung bình", hard: "Hard · Khó" };
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

  const lessonsByTopic = useMemo(() => {
    const grouped = new Map<string, typeof lessons>();
    for (const lesson of lessons) {
      const group = grouped.get(lesson.topic_id) ?? [];
      group.push(lesson);
      grouped.set(lesson.topic_id, group);
    }
    return grouped;
  }, [lessons]);
  const progressByLesson = useMemo(() => new Map(progress.map((row) => [row.lesson_id, row])), [progress]);
  const completedLevelsByTopic = useMemo(() => {
    const completed = new Map<string, Set<(typeof lessons)[number]["difficulty"]>>();
    for (const lesson of lessons) {
      if (progressByLesson.get(lesson.id)?.status !== "completed") continue;
      const levels = completed.get(lesson.topic_id) ?? new Set<(typeof lesson)["difficulty"]>();
      levels.add(lesson.difficulty);
      completed.set(lesson.topic_id, levels);
    }
    return completed;
  }, [lessons, progressByLesson]);
  const visibleTopics = useMemo(() => {
    const normalizedSearch = search.toLowerCase();
    return topics.filter((topic) => {
      const textMatches = `${topic.title_en} ${topic.title_vi} ${topic.description_en}`.toLowerCase().includes(normalizedSearch);
      const topicLessons = lessonsByTopic.get(topic.id) ?? [];
      return textMatches && topicLessons.some((lesson) => difficulty === "all" || lesson.difficulty === difficulty);
    });
  }, [topics, lessonsByTopic, difficulty, search]);
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

    {authenticated && <section className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700"><Target size={22}/></span><div><h2 className="text-lg font-extrabold text-slate-900">Your learning goal</h2><p className="text-sm text-slate-600">Choose a path. You can change it anytime.</p></div></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" disabled={savingPreference} onClick={() => void saveGoal("games")} aria-pressed={goal === "games"} className={`rounded-2xl border p-3 text-left transition ${goal === "games" ? "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}><span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Gamepad2 size={20} className="text-blue-600"/> Learn through games</span><span className="mt-1 block pl-7 text-sm leading-snug text-slate-600">Build vocabulary through quick play and recall.</span></button><button type="button" disabled={savingPreference} onClick={() => void saveGoal("conversation")} aria-pressed={goal === "conversation"} className={`rounded-2xl border p-3 text-left transition ${goal === "conversation" ? "border-violet-400 bg-violet-50 shadow-sm ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-200"}`}><span className="flex items-center gap-2 text-sm font-bold text-slate-900"><Headphones size={20} className="text-violet-700"/> Speak everyday English</span><span className="mt-1 block pl-7 text-sm leading-snug text-slate-600">Learn practical phrases and short conversations.</span></button></div>
      </div>
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Check size={22}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-x-2"><h2 className="font-extrabold text-slate-900">Today&apos;s practice</h2><span className="text-xs text-slate-500">{todayCompleted} of {dailyGoal} lessons completed</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, todayCompleted / dailyGoal * 100)}%` }}/></div></div></div><label className="mt-3 block text-xs font-bold text-slate-600">Daily lesson goal<Select aria-label="Daily lesson goal" className="!mt-1 !h-10 !rounded-xl !border-emerald-200" value={dailyGoal} onChange={(event) => void saveDailyGoal(Number(event.target.value))}>{[1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value} {value === 1 ? "lesson" : "lessons"} per day</option>)}</Select></label></div>
    </section>}

    {authenticated && dueItems.length > 0 && <section className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock3 size={22}/></span><div><h2 className="text-lg font-extrabold text-slate-900">Ready to review</h2><p className="text-sm text-slate-600">{dueItems.length} {dueItems.length === 1 ? "item is" : "items are"} due for practice.</p></div></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{dueItems.slice(0, 9).map((item) => <Link key={item.item_id} href={`/communication/${item.lesson_id}?reviewItem=${encodeURIComponent(item.item_id)}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3 hover:border-amber-300"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{item.content_en}</span><span className="block truncate text-xs text-slate-500">{item.meaning_vi} · {item.lesson_title_en}</span></span><ArrowRight size={16} className="shrink-0 text-amber-600"/></Link>)}</div></section>}

    <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2"><div><h2 className="text-xl font-extrabold text-slate-900">Choose a situation</h2><p className="mt-0.5 text-sm text-slate-500">Start with a practical topic and choose the level that suits you.</p></div><span className="text-sm font-medium text-slate-500">{visibleTopics.length} situations</span></div>
      <div className="mb-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input aria-label="Search situations" value={search} onChange={(e) => { savedSearch = e.target.value; setSearch(e.target.value); }} className="h-10 w-full rounded-xl border border-sky-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="Search situations…"/></label><Select aria-label="Filter lessons by difficulty" className="!h-10 !rounded-xl" value={difficulty} onChange={(e) => { savedDifficulty = e.target.value; setDifficulty(e.target.value); }}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></div>
      {loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/><div className="h-52 animate-pulse rounded-2xl bg-sky-50"/></div> : visibleTopics.length === 0 ? <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={32}/><p className="mt-3 font-bold text-slate-800">No published lessons yet</p><p className="mt-1 text-sm text-slate-500">New lessons will appear here after an admin publishes them.</p></div> : <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleTopics.map((topic, index) => {
        const allTopicLessons = lessonsByTopic.get(topic.id) ?? [];
        const topicLessons = allTopicLessons.filter((lesson) => difficulty === "all" || lesson.difficulty === difficulty);
        const completedLevels = completedLevelsByTopic.get(topic.id) ?? new Set();
        const requiredLevels = ["easy", "medium", "hard"] as const;
        const allLevelsCompleted = requiredLevels.every((level) => completedLevels.has(level));
        const TopicIcon = topicIcons[topic.slug] ?? BookOpen;
        const accent = topicAccents[index % topicAccents.length];
        return <article key={topic.id} className={`overflow-hidden rounded-2xl border p-3 ${accent}`}>
          <div className="flex min-h-[5.1rem] items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/80 shadow-sm"><TopicIcon size={22}/></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-extrabold uppercase tracking-wide">{topic.title_vi}</p><h3 className="truncate text-base font-extrabold text-slate-900">{topic.title_en}</h3><p className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-4 text-slate-600">{topic.description_en}</p></div></div>
          <div className="mb-1 flex justify-end text-[11px] font-semibold text-slate-500">{topicLessons.length} {topicLessons.length === 1 ? "lesson" : "lessons"}{authenticated && allLevelsCompleted && <span className="ml-1 text-emerald-700">· Completed</span>}{authenticated && !allLevelsCompleted && completedLevels.size > 0 && <span className="ml-1">· {completedLevels.size}/3 levels</span>}</div>
          <div className="overflow-hidden rounded-xl border border-white/90 bg-white/90">{topicLessons.map((lesson) => {
            const lessonProgress = progressByLesson.get(lesson.id);
            const status = lessonProgress?.status === "completed" ? "Completed" : lessonProgress?.status === "in_progress" ? "Continue" : "Start";
            const statusDot = lessonProgress?.status === "completed" ? "bg-emerald-500" : lessonProgress?.status === "in_progress" ? "bg-amber-400" : "bg-emerald-500";
            return <Link key={lesson.id} href={`/communication/${lesson.id}`} className="group flex min-h-8 items-center gap-2 border-b border-slate-100 px-2.5 py-1.5 last:border-b-0 hover:bg-blue-50/70"><span className={`size-2 shrink-0 rounded-full ${statusDot}`}/><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">{lesson.title_en}</span><span className="hidden shrink-0 text-[11px] text-slate-500 sm:inline">{difficultyLabel[lesson.difficulty]}</span><span className="shrink-0 text-[11px] font-bold text-blue-600">{status}</span><ArrowRight size={13} className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5"/></Link>;
          })}</div>
        </article>;
      })}</div>}
    </section>
  </main>;
}
