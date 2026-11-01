"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, LockKeyhole, RotateCcw, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type Lesson = { id: string; topic_id: string; title_en: string; title_vi: string; difficulty: "easy" | "medium" | "hard"; status: string };
type Topic = { id: string; title_en: string; title_vi: string };
type Item = { id: string; item_key: string; item_type: "word" | "phrase" | "sentence_pattern"; content_en: string; meaning_vi: string; example_en: string; example_vi: string; image_keyword: string; audio_url: string; sort_order: number };
type Dialogue = { id: string; title_en: string; title_vi: string; prompt_vi: string; sort_order: number };
type Turn = { id: string; speaker: string; text_en: string; meaning_vi: string; audio_url: string; response_prompt_vi: string; expected_response: string; response_options: string[]; turn_order: number };
type ItemReview = { status: "learning" | "mastered"; review_count: number; correct_count: number };

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return toast.error("Audio playback is not supported in this browser.");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function SituationalEnglishLesson({ lessonId, reviewItem }: { lessonId: string; reviewItem?: string }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dialogues, setDialogues] = useState<Array<Dialogue & { turns: Turn[] }>>([]);
  const [reviews, setReviews] = useState<Record<string, ItemReview>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const currentItem = items[currentIndex];
  const currentStatus = currentItem ? reviews[currentItem.id]?.status ?? "learning" : "learning";
  const masteredCount = items.filter((item) => reviews[item.id]?.status === "mastered").length;

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const lessonResult = await supabase.from("communication_lessons").select("id,topic_id,title_en,title_vi,difficulty,status").eq("id", lessonId).eq("status", "published").maybeSingle();
        if (lessonResult.error) throw lessonResult.error;
        if (!lessonResult.data) { if (active) setLesson(null); return; }
        const currentLesson = lessonResult.data as Lesson;
        const [topicResult, itemResult, dialogueResult, authResult] = await Promise.all([
          supabase.from("communication_topics").select("id,title_en,title_vi").eq("id", currentLesson.topic_id).eq("status", "published").maybeSingle(),
          supabase.from("communication_lesson_items").select("id,item_key,item_type,content_en,meaning_vi,example_en,example_vi,image_keyword,audio_url,sort_order").eq("lesson_id", lessonId).order("sort_order"),
          supabase.from("communication_dialogues").select("id,title_en,title_vi,prompt_vi,sort_order").eq("lesson_id", lessonId).order("sort_order"),
          supabase.auth.getUser(),
        ]);
        if (topicResult.error) throw topicResult.error;
        if (itemResult.error) throw itemResult.error;
        if (dialogueResult.error) throw dialogueResult.error;
        if (!active) return;
        const loadedItems = (itemResult.data ?? []) as Item[];
        setLesson(currentLesson); setTopic(topicResult.data as Topic | null); setItems(loadedItems); setUserId(authResult.data.user?.id ?? null);
        if (reviewItem) {
          const dueIndex = loadedItems.findIndex((item) => item.id === reviewItem);
          if (dueIndex >= 0) setCurrentIndex(dueIndex);
        }
        const foundDialogues = (dialogueResult.data ?? []) as Dialogue[];
        if (foundDialogues.length) {
          const turnsResult = await supabase.from("communication_dialogue_turns").select("id,dialogue_id,speaker,text_en,meaning_vi,audio_url,response_prompt_vi,expected_response,response_options,turn_order").in("dialogue_id", foundDialogues.map((dialogue) => dialogue.id)).order("turn_order");
          if (turnsResult.error) throw turnsResult.error;
          const turns = (turnsResult.data ?? []) as (Turn & { dialogue_id: string })[];
          setDialogues(foundDialogues.map((dialogue) => ({ ...dialogue, turns: turns.filter((turn) => turn.dialogue_id === dialogue.id) })));
        }
        const user = authResult.data.user;
        if (user) {
          const [reviewResult, progressResult] = await Promise.all([
            supabase.from("communication_item_reviews").select("item_id,status,review_count,correct_count").eq("user_id", user.id).in("item_id", (itemResult.data ?? []).map((item) => item.id)),
            supabase.from("communication_lesson_progress").select("status").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle(),
          ]);
          if (reviewResult.error) throw reviewResult.error;
          if (active) setReviews(Object.fromEntries((reviewResult.data ?? []).map((row) => [row.item_id, { status: row.status, review_count: row.review_count, correct_count: row.correct_count }])));
          if (!progressResult.error && !progressResult.data) {
            await supabase.from("communication_lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId, status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_id" });
          } else if (progressResult.data?.status === "not_started") {
            await supabase.from("communication_lesson_progress").update({ status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("user_id", user.id).eq("lesson_id", lessonId);
          }
        }
      } catch (error) { console.error("Failed to load situational English lesson", error); toast.error("Could not load this lesson."); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; window.speechSynthesis?.cancel(); };
  }, [lessonId, reviewItem, supabase]);

  async function setItemStatus(item: Item, status: "learning" | "mastered") {
    if (!userId) { toast.error("Sign in to save your learning progress."); return; }
    setSaving(true);
    const existingReview = reviews[item.id];
    const now = new Date().toISOString();
    const { error } = await supabase.from("communication_item_reviews").upsert({
      user_id: userId, item_id: item.id, status, review_count: (existingReview?.review_count ?? 0) + 1,
      correct_count: (existingReview?.correct_count ?? 0) + (status === "mastered" ? 1 : 0), last_reviewed_at: now,
      due_at: status === "mastered" ? new Date(Date.now() + 7 * 86400000).toISOString() : now, updated_at: now,
    }, { onConflict: "user_id,item_id" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const nextReviews = { ...reviews, [item.id]: { status, review_count: (existingReview?.review_count ?? 0) + 1, correct_count: (existingReview?.correct_count ?? 0) + (status === "mastered" ? 1 : 0) } };
    setReviews(nextReviews);
    const nextMastered = items.filter((candidate) => nextReviews[candidate.id]?.status === "mastered").length;
    const completed = items.length > 0 && nextMastered === items.length;
    const { error: progressError } = await supabase.from("communication_lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, status: completed ? "completed" : "in_progress", completed_items: nextMastered, completed_at: completed ? now : null, updated_at: now }, { onConflict: "user_id,lesson_id" });
    if (progressError) toast.error(progressError.message);
    else toast.success(status === "mastered" ? "Marked as mastered." : "Saved for more practice.");
    setSaving(false);
  }

  function answerDialogue(turn: Turn, answer: string) {
    setAnswers((current) => ({ ...current, [turn.id]: answer }));
    if (answer === turn.expected_response) toast.success("That's a natural response!");
    else toast("Try another response and listen to the line again.");
  }

  if (loading) return <main className="rounded-3xl border border-sky-100 bg-white p-8 text-center text-slate-500">Loading lesson…</main>;
  if (!lesson || !topic) return <main className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-slate-900">Lesson unavailable</h1><p className="mt-2 text-sm text-slate-600">This lesson may be unpublished or removed.</p><Link className="mt-4 inline-flex font-bold text-blue-700" href="/communication"><ArrowLeft size={17}/> Back to situations</Link></main>;

  return <main className="space-y-5">
    <Link href="/communication" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white"><ArrowLeft size={17}/> All situations</Link>
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7"><p className="text-sm font-bold text-blue-600">{topic.title_en} · {topic.title_vi}</p><h1 className="page-title mt-1 text-3xl sm:text-4xl">{lesson.title_en}</h1><p className="mt-1 text-slate-600">{lesson.title_vi} <span className="mx-1">·</span><span className="capitalize">{lesson.difficulty}</span></p><div className="mt-4 flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sky-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${items.length ? masteredCount / items.length * 100 : 0}%` }}/></div><span className="text-sm font-bold text-slate-700">{masteredCount}/{items.length} mastered</span></div></header>
    {!userId && <aside className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole size={18}/> Sign in to record completed items and build your review schedule. <Link href="/login" className="font-bold underline">Log in</Link></aside>}
    {items.length === 0 ? <section className="rounded-3xl border border-dashed border-sky-200 bg-white p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={34}/><p className="mt-3 font-bold text-slate-900">This lesson is being prepared</p><p className="mt-1 text-sm text-slate-500">Learning items will appear here when they are added.</p></section> : <section className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm sm:p-7">
      <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{currentItem.item_type.replace("_", " ")}</p><p className="mt-1 text-sm text-slate-500">Item {currentIndex + 1} of {items.length}</p></div><button type="button" onClick={() => currentItem.audio_url ? new Audio(currentItem.audio_url).play().catch(() => speak(currentItem.content_en)) : speak(currentItem.example_en || currentItem.content_en)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button></div>
      <article className="rounded-3xl bg-gradient-to-br from-sky-50 to-white p-6 text-center sm:p-10"><h2 className="break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{currentItem.content_en}</h2>{revealed ? <div className="mt-5 space-y-2"><p className="text-xl font-bold text-blue-700">{currentItem.meaning_vi}</p>{currentItem.example_en && <p className="mx-auto max-w-2xl text-lg text-slate-700">{currentItem.example_en}</p>}{currentItem.example_vi && <p className="text-sm text-slate-500">{currentItem.example_vi}</p>}</div> : <button type="button" onClick={() => setRevealed(true)} className="mt-6 min-h-11 rounded-full border border-blue-300 bg-white px-6 text-sm font-bold text-blue-700 shadow-sm">Show meaning</button>}</article>
      {revealed && <div className="mt-4 flex flex-wrap justify-center gap-3"><button type="button" disabled={saving} onClick={() => void setItemStatus(currentItem, "learning")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${currentStatus === "learning" ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600"}`}><RotateCcw size={16}/> Learning</button><button type="button" disabled={saving} onClick={() => void setItemStatus(currentItem, "mastered")} className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold ${currentStatus === "mastered" ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600"}`}><Check size={16}/> Mastered</button></div>}
      <div className="mt-5 flex items-center justify-center gap-3"><button type="button" disabled={currentIndex === 0} onClick={() => { setCurrentIndex((index) => index - 1); setRevealed(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-sky-200 px-5 text-sm font-bold text-blue-700 disabled:opacity-40"><ArrowLeft size={16}/> Previous</button><button type="button" disabled={currentIndex >= items.length - 1} onClick={() => { setCurrentIndex((index) => index + 1); setRevealed(false); }} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-40">Next item <ArrowRight size={16}/></button></div>
    </section>}
    {dialogues.length > 0 && <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6"><div className="mb-4 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Headphones size={22}/></span><div><h2 className="text-xl font-extrabold text-slate-900">Conversation practice</h2><p className="text-sm text-slate-500">Listen to each line, then choose a natural response.</p></div></div><div className="space-y-5">{dialogues.map((dialogue) => <article key={dialogue.id} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4"><h3 className="font-bold text-slate-900">{dialogue.title_en}</h3><p className="text-sm text-slate-500">{dialogue.prompt_vi || dialogue.title_vi}</p><div className="mt-3 space-y-3">{dialogue.turns.map((turn) => <div key={turn.id} className="rounded-2xl bg-white p-3"><div className="flex items-start gap-3"><button type="button" aria-label={`Play ${turn.speaker}'s line`} onClick={() => turn.audio_url ? new Audio(turn.audio_url).play().catch(() => speak(turn.text_en)) : speak(turn.text_en)} className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Volume2 size={17}/></button><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{turn.speaker}</p><p className="font-semibold text-slate-900">{turn.text_en}</p>{turn.meaning_vi && <p className="text-sm text-slate-500">{turn.meaning_vi}</p>}{turn.response_options.length > 0 && <div className="mt-3"><p className="mb-2 text-sm font-semibold text-violet-800">{turn.response_prompt_vi || "Choose your response"}</p><div className="flex flex-wrap gap-2">{turn.response_options.map((option) => <button key={option} type="button" onClick={() => answerDialogue(turn, option)} className={`rounded-xl border px-3 py-2 text-sm font-medium ${answers[turn.id] === option ? option === turn.expected_response ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-rose-300 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-700"}`}>{option}</button>)}</div></div>}</div></div></div>)}</div></article>)}</div></section>}
  </main>;
}
