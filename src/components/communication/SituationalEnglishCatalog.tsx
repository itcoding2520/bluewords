"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Check, Clock3, Gamepad2, Headphones, MessageCircle, Search, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getCachedCommunicationCatalogSnapshot, getCommunicationCatalogCache, invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import { Select } from "@/components/ui/Select";

type Goal = "games" | "conversation";
type Topic = { id: string; slug: string; title_en: string; title_vi: string; description_en: string; description_vi: string; sort_order: number };
type Lesson = { id: string; topic_id: string; title_en: string; title_vi: string; difficulty: "easy" | "medium" | "hard"; sort_order: number };
type Progress = { lesson_id: string; status: "not_started" | "in_progress" | "completed"; completed_items: number };
type ReviewItem = { item_id: string; due_at: string; content_en: string; meaning_vi: string; lesson_id: string; lesson_title_en: string; lesson_title_vi: string };
type CatalogData = { topics: Topic[]; lessons: Lesson[]; progress: Progress[]; goal: Goal | null; dailyGoal: number; todayCompleted: number; dueItems: ReviewItem[]; authenticated: boolean };
const difficultyLabel = { easy: "Easy · Dễ", medium: "Medium · Trung bình", hard: "Hard · Khó" };
let savedDifficulty = "all";
let savedSearch = "";

function localDayStart() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day.toISOString();
}

export function SituationalEnglishCatalog() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [dueItems, setDueItems] = useState<ReviewItem[]>([]);
  const [difficulty, setDifficulty] = useState(savedDifficulty);
  const [search, setSearch] = useState(savedSearch);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError) throw authError;
        const user = session?.user ?? null;
        const cacheKey = user?.id ?? "guest";
        const applySnapshot = (snapshot: CatalogData) => {
          setAuthenticated(snapshot.authenticated);
          setTopics(snapshot.topics);
          setLessons(snapshot.lessons);
          setProgress(snapshot.progress);
          setGoal(snapshot.goal);
          setDailyGoal(snapshot.dailyGoal);
          setTodayCompleted(snapshot.todayCompleted);
          setDueItems(snapshot.dueItems);
        };
        const cachedSnapshot = getCachedCommunicationCatalogSnapshot<CatalogData>(cacheKey);
        if (cachedSnapshot && active) {
          applySnapshot(cachedSnapshot);
          setLoading(false);
        }
        const snapshot = await getCommunicationCatalogCache(cacheKey, async (): Promise<CatalogData> => {
          const [topicResult, lessonResult] = await Promise.all([
            supabase.from("communication_topics").select("id,slug,title_en,title_vi,description_en,description_vi,sort_order").eq("status", "published").order("sort_order"),
            supabase.from("communication_lessons").select("id,topic_id,title_en,title_vi,difficulty,sort_order,communication_topics!inner(status)").eq("status", "published").eq("communication_topics.status", "published").order("sort_order"),
          ]);
          if (topicResult.error) throw topicResult.error;
          if (lessonResult.error) throw lessonResult.error;
          const data: CatalogData = {
            topics: (topicResult.data ?? []) as unknown as Topic[],
            lessons: (lessonResult.data ?? []) as unknown as Lesson[],
            progress: [], goal: null, dailyGoal: 1, todayCompleted: 0, dueItems: [], authenticated: Boolean(user),
          };
          if (!user) return data;

          const [progressResult, preferenceResult, dailyGoalResult, completedResult, dueResult] = await Promise.all([
            supabase.from("communication_lesson_progress").select("lesson_id,status,completed_items").eq("user_id", user.id),
            supabase.from("communication_learning_preferences").select("learning_goal").eq("user_id", user.id).maybeSingle(),
            supabase.from("communication_daily_goals").select("lessons_per_day").eq("user_id", user.id).maybeSingle(),
            supabase.from("communication_lesson_progress").select("lesson_id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed").gte("completed_at", localDayStart()),
            supabase.from("communication_item_reviews").select("item_id,due_at").eq("user_id", user.id).lte("due_at", new Date().toISOString()).order("due_at").limit(50),
          ]);
          if (!progressResult.error) data.progress = (progressResult.data ?? []) as Progress[];
          if (!preferenceResult.error) data.goal = (preferenceResult.data?.learning_goal as Goal | undefined) ?? null;
          if (!dailyGoalResult.error) data.dailyGoal = dailyGoalResult.data?.lessons_per_day ?? 1;
          if (!completedResult.error) data.todayCompleted = completedResult.count ?? 0;
          if (dueResult.error) console.error("Failed to load due communication reviews", dueResult.error);
          if (!dueResult.data?.length) return data;

          const itemResult = await supabase.from("communication_lesson_items").select("id,lesson_id,content_en,meaning_vi").in("id", dueResult.data.map((review) => review.item_id));
          if (itemResult.error) throw itemResult.error;
          const lessonIds = [...new Set((itemResult.data ?? []).map((item) => item.lesson_id))];
          const dueLessons = lessonIds.length
            ? await supabase.from("communication_lessons").select("id,title_en,title_vi").in("id", lessonIds).eq("status", "published")
            : { data: [], error: null };
          if (dueLessons.error) throw dueLessons.error;
          const lessonsById = new Map((dueLessons.data ?? []).map((lesson) => [lesson.id, lesson]));
          const dueAtById = new Map(dueResult.data.map((review) => [review.item_id, review.due_at]));
          data.dueItems = (itemResult.data ?? []).flatMap((item) => {
            const lesson = lessonsById.get(item.lesson_id);
            return lesson ? [{ item_id: item.id, due_at: dueAtById.get(item.id) ?? "", content_en: item.content_en, meaning_vi: item.meaning_vi, lesson_id: item.lesson_id, lesson_title_en: lesson.title_en, lesson_title_vi: lesson.title_vi }] : [];
          });
          return data;
        });
        if (!active) return;
        applySnapshot(snapshot);
      } catch (error) { console.error("Failed to load situational English catalog", error); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [supabase]);

  async function saveGoal(nextGoal: Goal) {
    if (!authenticated) { toast.error("Sign in to save your learning goal."); return; }
    setSavingPreference(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSavingPreference(false); return; }
    const { error } = await supabase.from("communication_learning_preferences").upsert({ user_id: user.id, learning_goal: nextGoal, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error(error.message);
    else { invalidateCommunicationCatalogCache(user.id); setGoal(nextGoal); toast.success("Learning goal saved."); }
    setSavingPreference(false);
  }

  async function saveDailyGoal(value: number) {
    setDailyGoal(value);
    if (!authenticated) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("communication_daily_goals").upsert({ user_id: user.id, lessons_per_day: value, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error(error.message); else { invalidateCommunicationCatalogCache(user.id); toast.success("Daily goal saved."); }
  }

  const visibleTopics = topics.filter((topic) => {
    const textMatches = `${topic.title_en} ${topic.title_vi} ${topic.description_en}`.toLowerCase().includes(search.toLowerCase());
    return textMatches && lessons.some((lesson) => lesson.topic_id === topic.id && (difficulty === "all" || lesson.difficulty === difficulty));
  });
  const suggestedLesson = lessons.find((lesson) => !progress.some((row) => row.lesson_id === lesson.id && row.status === "completed"));

  return <main className="space-y-6">
    <header className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-6 shadow-[0_16px_40px_rgb(37_99_235/0.08)] sm:p-9">
      <div className="relative z-10 max-w-3xl"><span className="text-sm font-bold text-blue-600">Everyday English · Tiếng Anh giao tiếp</span><h1 className="page-title mt-2 text-4xl sm:text-5xl">Learn by situation</h1><p className="page-intro-description mt-3 max-w-2xl text-base">Connect useful words to phrases, sentence patterns, and short conversations you can use in real life.</p></div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/85 px-4 py-2 text-sm font-semibold text-slate-700"><BookOpen size={17} className="text-blue-600"/> Word → phrase → sentence → dialogue</span>{suggestedLesson && <Link href={`/communication/${suggestedLesson.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200">Continue learning <ArrowRight size={17}/></Link>}</div>
      <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 grid size-56 place-items-center rounded-full bg-white/45 text-blue-300"><MessageCircle size={96}/><Sparkles className="absolute right-9 top-10 text-amber-400" size={24}/></div>
    </header>

    {!authenticated && <aside className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">You can explore published lessons. Sign in to choose a goal, save daily progress, and review items. <Link className="ml-1 font-bold underline" href="/login">Log in</Link></aside>}

    {authenticated && <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)]">
      <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Target size={22}/></span><div><h2 className="text-lg font-extrabold text-slate-900">Your learning goal</h2><p className="mt-1 text-sm text-slate-600">Choose a path. You can change it anytime.</p></div></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2"><button type="button" disabled={savingPreference} onClick={() => void saveGoal("games")} aria-pressed={goal === "games"} className={`rounded-2xl border p-4 text-left transition ${goal === "games" ? "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-100" : "border-slate-200 bg-white hover:border-blue-200"}`}><span className="flex items-center gap-2 font-bold text-slate-900"><Gamepad2 size={19} className="text-blue-600"/> Learn through games</span><span className="mt-1 block text-sm text-slate-600">Build vocabulary through quick play and recall.</span></button><button type="button" disabled={savingPreference} onClick={() => void saveGoal("conversation")} aria-pressed={goal === "conversation"} className={`rounded-2xl border p-4 text-left transition ${goal === "conversation" ? "border-violet-400 bg-violet-50 shadow-sm ring-2 ring-violet-100" : "border-slate-200 bg-white hover:border-violet-200"}`}><span className="flex items-center gap-2 font-bold text-slate-900"><Headphones size={19} className="text-violet-600"/> Speak everyday English</span><span className="mt-1 block text-sm text-slate-600">Learn practical phrases and short conversations.</span></button></div>
      </div>
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-sm sm:p-5"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Check size={22}/></span><div><h2 className="font-extrabold text-slate-900">Today&apos;s practice</h2><p className="text-sm text-slate-600">{todayCompleted} of {dailyGoal} lessons completed</p></div></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, todayCompleted / dailyGoal * 100)}%` }}/></div><label className="mt-4 block text-xs font-bold text-slate-600">Daily lesson goal<Select aria-label="Daily lesson goal" className="!mt-1 !h-11 !rounded-xl !border-emerald-200" value={dailyGoal} onChange={(event) => void saveDailyGoal(Number(event.target.value))}>{[1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value} {value === 1 ? "lesson" : "lessons"} per day</option>)}</Select></label></div>
    </section>}

    {authenticated && dueItems.length > 0 && <section className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Clock3 size={22}/></span><div><h2 className="text-lg font-extrabold text-slate-900">Ready to review</h2><p className="text-sm text-slate-600">{dueItems.length} {dueItems.length === 1 ? "item is" : "items are"} due for practice.</p></div></div></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{dueItems.slice(0, 9).map((item) => <Link key={item.item_id} href={`/communication/${item.lesson_id}?reviewItem=${encodeURIComponent(item.item_id)}`} className="flex min-w-0 items-center gap-3 rounded-2xl border border-amber-100 bg-white p-3 hover:border-amber-300"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{item.content_en}</span><span className="block truncate text-xs text-slate-500">{item.meaning_vi} · {item.lesson_title_en}</span></span><ArrowRight size={16} className="shrink-0 text-amber-600"/></Link>)}</div></section>}

    <section className="rounded-3xl border border-sky-100 bg-white/90 p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-extrabold text-slate-900">Choose a situation</h2><p className="mt-1 text-sm text-slate-500">Start with a practical topic and choose the level that suits you.</p></div><span className="text-sm text-slate-500">{topics.length} situations</span></div>
      <div className="mb-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]"><label className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17}/><input aria-label="Search situations" value={search} onChange={(e) => { savedSearch = e.target.value; setSearch(e.target.value); }} className="h-12 w-full rounded-2xl border border-sky-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" placeholder="Search situations…"/></label><Select aria-label="Filter lessons by difficulty" value={difficulty} onChange={(e) => { savedDifficulty = e.target.value; setDifficulty(e.target.value); }}><option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></Select></div>
      {loading ? <div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-3xl bg-sky-50"/><div className="h-48 animate-pulse rounded-3xl bg-sky-50"/></div> : visibleTopics.length === 0 ? <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={32}/><p className="mt-3 font-bold text-slate-800">No published lessons yet</p><p className="mt-1 text-sm text-slate-500">New lessons will appear here after an admin publishes them.</p></div> : <div className="grid gap-4 md:grid-cols-2">{visibleTopics.map((topic, index) => {
        const topicLessons = lessons.filter((lesson) => lesson.topic_id === topic.id && (difficulty === "all" || lesson.difficulty === difficulty));
        const completeCount = topicLessons.filter((lesson) => progress.some((row) => row.lesson_id === lesson.id && row.status === "completed")).length;
        return <article key={topic.id} className={`overflow-hidden rounded-3xl border p-4 sm:p-5 ${["border-sky-200 bg-sky-50/60", "border-violet-200 bg-violet-50/50", "border-emerald-200 bg-emerald-50/50", "border-amber-200 bg-amber-50/50"][index % 4]}`}>
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{topic.title_vi}</p><h3 className="mt-1 text-xl font-extrabold text-slate-900">{topic.title_en}</h3><p className="mt-2 text-sm text-slate-600">{topic.description_en}</p></div><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/80 text-blue-600"><BookOpen size={22}/></span></div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500"><span>{topicLessons.length} {topicLessons.length === 1 ? "lesson" : "lessons"}</span><span>{completeCount} completed</span></div>
          <div className="mt-3 space-y-2">{topicLessons.map((lesson) => {
            const lessonProgress = progress.find((row) => row.lesson_id === lesson.id);
            return <Link key={lesson.id} href={`/communication/${lesson.id}`} className="group flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 transition hover:border-blue-200 hover:shadow-sm"><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-slate-900">{lesson.title_en}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{lesson.title_vi} · {difficultyLabel[lesson.difficulty]}</span></span><span className="text-xs font-semibold text-blue-700">{lessonProgress?.status === "completed" ? "Completed" : lessonProgress?.status === "in_progress" ? "In progress" : "Start"}</span><ArrowRight size={16} className="shrink-0 text-blue-600 transition group-hover:translate-x-0.5"/></Link>;
          })}</div>
        </article>;
      })}</div>}
    </section>
  </main>;
}
