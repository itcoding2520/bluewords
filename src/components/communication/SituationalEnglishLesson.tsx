"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, LockKeyhole, Volume2, Zap } from "lucide-react";
import { toast } from "sonner";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import { createAnswerChoices, createSentenceDrills, getCorrectReviewIntervalDays, normalizeSentence, shuffled } from "@/lib/communication/lesson-practice";
import { getNextLessonProgress } from "@/lib/communication/lesson-progress";
import { useSituationalEnglishLessonData, type Item, type ItemReview, type Turn } from "@/hooks/useSituationalEnglishLessonData";
import { ConversationPractice } from "@/components/communication/ConversationPractice";
import { StudyCardView } from "@/components/communication/StudyCardView";
import { AnswerChoiceList } from "@/components/communication/AnswerChoiceList";
import { SentenceDrillView } from "@/components/communication/SentenceDrillView";
function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return toast.error("Audio playback is not supported in this browser.");
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function SituationalEnglishLesson({ lessonId, reviewItem }: { lessonId: string; reviewItem?: string }) {
  const supabase = useSupabaseClient();
  const { lesson, topic, items, dialogues, reviews, setReviews, userId, loading, currentIndex, setCurrentIndex, practiceOrder, setPracticeOrder } = useSituationalEnglishLessonData(supabase, lessonId, reviewItem);
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<"study" | "practice" | "drills" | "listening">("study");
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [listeningOrder, setListeningOrder] = useState<string[]>([]);
  const [drillStep, setDrillStep] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState<string | null>(null);
  const [orderedTiles, setOrderedTiles] = useState<Array<{ id: number; text: string }>>([]);
  const [saving, setSaving] = useState(false);
  const currentItem = items[currentIndex];
  const currentStatus = currentItem ? reviews[currentItem.id]?.status ?? "learning" : "learning";
  const masteredCount = items.filter((item) => reviews[item.id]?.status === "mastered").length;
  const practiceItem = items.find((item) => item.id === practiceOrder[practiceStep]);
  const listeningItems = useMemo(() => items.filter((item) => item.example_en.trim() && item.example_vi.trim()), [items]);
  const listeningItem = items.find((item) => item.id === listeningOrder[practiceStep]);
  const sentenceDrills = useMemo(() => createSentenceDrills(items), [items]);
  const currentDrill = sentenceDrills[drillStep];
  const practiceMeaningCount = new Set(items.map((item) => item.meaning_vi)).size;

  async function setItemStatus(item: Item, status: "learning" | "mastered") {
    if (!userId) { toast.error("Sign in to save your learning progress."); return; }
    setSaving(true);
    const existingReview = reviews[item.id];
    const now = new Date().toISOString();
    const { error } = await supabase.from("communication_item_reviews").upsert({
      user_id: userId, item_id: item.id, status, review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0, last_reviewed_at: now,
      due_at: status === "mastered" ? new Date(Date.now() + 7 * 86400000).toISOString() : now, updated_at: now,
    }, { onConflict: "user_id,item_id" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const { nextReviews, masteredCount, completed } = getNextLessonProgress(items, reviews, item.id, {
      status,
      review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0,
    });
    setReviews(nextReviews);
    const { error: progressError } = await supabase.from("communication_lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, status: completed ? "completed" : "in_progress", completed_items: masteredCount, completed_at: completed ? now : null, updated_at: now }, { onConflict: "user_id,lesson_id" });
    if (progressError) toast.error(progressError.message);
    else { invalidateCommunicationCatalogCache(userId); toast.success(status === "mastered" ? "Marked as mastered." : "Saved for more practice."); }
    setSaving(false);
  }

  async function recordPracticeOutcome(item: Item, correct: boolean) {
    if (!userId) return;
    setSaving(true);
    const existingReview = reviews[item.id];
    const nextReviewCount = (existingReview?.review_count ?? 0) + 1;
    const nextCorrectCount = (existingReview?.correct_count ?? 0) + (correct ? 1 : 0);
    const nextStatus: ItemReview["status"] = correct && nextCorrectCount >= 2 ? "mastered" : existingReview?.status === "mastered" && correct ? "mastered" : "learning";
    const reviewedAt = new Date();
    const now = reviewedAt.toISOString();
    const nextDueAt = correct
      ? new Date(reviewedAt.getTime() + getCorrectReviewIntervalDays(nextReviewCount, nextCorrectCount, lesson?.difficulty ?? "medium") * 86400000).toISOString()
      : new Date(reviewedAt.getTime() + 15 * 60000).toISOString();
    const { error } = await supabase.from("communication_item_reviews").upsert({
      user_id: userId, item_id: item.id, status: nextStatus, review_count: nextReviewCount,
      correct_count: nextCorrectCount, last_reviewed_at: now, due_at: nextDueAt, updated_at: now,
    }, { onConflict: "user_id,item_id" });
    if (error) {
      toast.error("Could not save this practice result.");
    } else {
      const { nextReviews, masteredCount, completed } = getNextLessonProgress(items, reviews, item.id, {
        status: nextStatus,
        review_count: nextReviewCount,
        correct_count: nextCorrectCount,
      });
      setReviews(nextReviews);
      const { error: progressError } = await supabase.from("communication_lesson_progress").upsert({
        user_id: userId, lesson_id: lessonId, status: completed ? "completed" : "in_progress",
        completed_items: masteredCount, completed_at: completed ? now : null, updated_at: now,
      }, { onConflict: "user_id,lesson_id" });
      if (progressError) toast.error("Answer saved, but lesson progress could not be updated.");
      else { invalidateCommunicationCatalogCache(userId); toast(correct ? "Correct! This item is scheduled for review." : "Not quite. This item will come back for practice."); }
    }
    setSaving(false);
  }

  async function recordPracticeAnswer(item: Item, answer: string) {
    if (practiceAnswer !== null || saving) return;
    setPracticeAnswer(answer);
    await recordPracticeOutcome(item, answer === item.meaning_vi);
  }

  async function recordListeningAnswer(item: Item, answer: string) {
    if (practiceAnswer !== null || saving) return;
    setPracticeAnswer(answer);
    await recordPracticeOutcome(item, answer === item.example_vi);
  }

  function playListeningItem(item: Item) {
    if (item.audio_url) {
      const audio = new Audio(item.audio_url);
      void audio.play().catch(() => speak(item.example_en));
    } else {
      speak(item.example_en);
    }
  }

  async function submitSentenceDrill(answer: string) {
    if (!currentDrill || drillAnswer !== null || saving) return;
    setDrillAnswer(answer);
    await recordPracticeOutcome(currentDrill.item, normalizeSentence(answer) === normalizeSentence(currentDrill.answer));
  }

  function nextSentenceDrill() {
    setDrillAnswer(null);
    setOrderedTiles([]);
    setDrillStep((step) => step + 1);
  }

  function nextPracticeQuestion() {
    setPracticeAnswer(null);
    setPracticeStep((current) => current + 1);
  }

  const practiceChoices = useMemo(() => practiceItem
    ? createAnswerChoices(practiceItem.meaning_vi, items.filter((item) => item.id !== practiceItem.id).map((item) => item.meaning_vi))
    : [], [practiceItem, items]);
  const listeningChoices = useMemo(() => listeningItem
    ? createAnswerChoices(listeningItem.example_vi, listeningItems.filter((item) => item.id !== listeningItem.id).map((item) => item.example_vi))
    : [], [listeningItem, listeningItems]);

  function playDialogueTurn(turn: Turn) {
    if (turn.audio_url) new Audio(turn.audio_url).play().catch(() => speak(turn.text_en));
    else speak(turn.text_en);
  }

  if (loading) return <main className="rounded-3xl border border-sky-100 bg-white p-8 text-center text-slate-500">Loading lesson…</main>;
  if (!lesson || !topic) return <main className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-slate-900">Lesson unavailable</h1><p className="mt-2 text-sm text-slate-600">This lesson may be unpublished or removed.</p><Link className="mt-4 inline-flex font-bold text-blue-700" href="/communication"><ArrowLeft size={17}/> Back to situations</Link></main>;

  return <main className="space-y-5">
    <Link href="/communication" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white"><ArrowLeft size={17}/> All situations</Link>
    <header className="rounded-3xl border border-sky-100 bg-gradient-to-r from-white via-sky-50 to-cyan-100 p-5 sm:p-7"><p className="text-sm font-bold text-blue-600">{topic.title_en} · {topic.title_vi}</p><h1 className="page-title mt-1 text-3xl sm:text-4xl">{lesson.title_en}</h1><p className="mt-1 text-slate-600">{lesson.title_vi} <span className="mx-1">·</span><span className="capitalize">{lesson.difficulty}</span></p><div className="mt-4 flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sky-100"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${items.length ? masteredCount / items.length * 100 : 0}%` }}/></div><span className="text-sm font-bold text-slate-700">{masteredCount}/{items.length} mastered</span></div></header>
    {!userId && <aside className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole size={18}/> Sign in to record completed items and build your review schedule. <Link href="/login" className="font-bold underline">Log in</Link></aside>}
    {items.length === 0 ? <section className="rounded-3xl border border-dashed border-sky-200 bg-white p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={34}/><p className="mt-3 font-bold text-slate-900">This lesson is being prepared</p><p className="mt-1 text-sm text-slate-500">Learning items will appear here when they are added.</p></section> : <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <div className="flex flex-wrap border-b border-sky-100 bg-sky-50/60 p-2">
        <button type="button" onClick={() => setMode("study")} aria-pressed={mode === "study"} className={`min-h-10 rounded-xl px-4 text-sm font-bold ${mode === "study" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Study cards</button>
        <button type="button" onClick={() => { setMode("practice"); setPracticeOrder(shuffled(items.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }} aria-pressed={mode === "practice"} disabled={practiceMeaningCount < 2} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-40 ${mode === "practice" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><Zap size={16}/> Quick practice</button>
        <button type="button" onClick={() => { setMode("drills"); setDrillStep(0); setDrillAnswer(null); setOrderedTiles([]); }} aria-pressed={mode === "drills"} disabled={sentenceDrills.length === 0} className={`min-h-10 rounded-xl px-4 text-sm font-bold disabled:opacity-40 ${mode === "drills" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}>Sentence drills</button>
        <button type="button" onClick={() => { setMode("listening"); setListeningOrder(shuffled(listeningItems.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }} aria-pressed={mode === "listening"} disabled={new Set(listeningItems.map((item) => item.example_vi)).size < 2} className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold disabled:opacity-40 ${mode === "listening" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"}`}><Headphones size={16}/> Listening</button>
      </div>
      {mode === "study" && <StudyCardView
        item={currentItem}
        index={currentIndex}
        itemCount={items.length}
        revealed={revealed}
        status={currentStatus}
        saving={saving}
        onReveal={() => setRevealed(true)}
        onStatusChange={(status) => void setItemStatus(currentItem, status)}
        onPrevious={() => { setCurrentIndex((index) => index - 1); setRevealed(false); }}
        onNext={() => { setCurrentIndex((index) => index + 1); setRevealed(false); }}
        onListen={() => currentItem.audio_url ? new Audio(currentItem.audio_url).play().catch(() => speak(currentItem.content_en)) : speak(currentItem.example_en || currentItem.content_en)}
      />}
      {mode === "practice" && <div className="p-4 sm:p-7">
        {!practiceItem ? <div className="rounded-3xl bg-emerald-50 p-8 text-center"><Check className="mx-auto text-emerald-600" size={34}/><h2 className="mt-3 text-xl font-extrabold text-slate-900">Practice round complete</h2><p className="mt-1 text-sm text-slate-600">You reviewed {practiceOrder.length} items. Correct and incorrect answers are saved to your review schedule when signed in.</p><button type="button" onClick={() => { setPracticeOrder(shuffled(items.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }} className="mt-5 min-h-11 rounded-full bg-blue-600 px-5 text-sm font-bold text-white">Practice again</button></div> : <>
          <div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Meaning check</p><p className="mt-1 text-sm text-slate-500">Question {practiceStep + 1} of {practiceOrder.length}</p></div><button type="button" onClick={() => practiceItem.audio_url ? new Audio(practiceItem.audio_url).play().catch(() => speak(practiceItem.content_en)) : speak(practiceItem.content_en)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Listen</button></div>
          <article className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 text-center sm:p-9"><p className="text-sm font-semibold text-slate-500">Choose the Vietnamese meaning</p><h2 className="mt-2 break-words text-3xl font-extrabold text-slate-900 sm:text-4xl">{practiceItem.content_en}</h2></article>
          <AnswerChoiceList choices={practiceChoices} selectedAnswer={practiceAnswer} correctAnswer={practiceItem.meaning_vi} disabled={practiceAnswer !== null || saving} onSelect={(choice) => void recordPracticeAnswer(practiceItem, choice)}/>
          {practiceAnswer !== null && <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4 ${practiceAnswer === practiceItem.meaning_vi ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><p className="font-bold">{practiceAnswer === practiceItem.meaning_vi ? "Correct! Nice recall." : `Not quite. The answer is “${practiceItem.meaning_vi}”.`}</p><button type="button" onClick={nextPracticeQuestion} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white">Next question <ArrowRight size={16}/></button></div>}
        </>}
      </div>}
      {mode === "listening" && <div className="p-4 sm:p-7">
        {!listeningItem ? <div className="rounded-3xl bg-emerald-50 p-8 text-center"><Check className="mx-auto text-emerald-600" size={34}/><h2 className="mt-3 text-xl font-extrabold text-slate-900">Listening round complete</h2><p className="mt-1 text-sm text-slate-600">You listened to {listeningOrder.length} example sentences. Answers are added to item review scheduling when you are signed in.</p><button type="button" onClick={() => { setListeningOrder(shuffled(listeningItems.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }} className="mt-5 min-h-11 rounded-full bg-blue-600 px-5 text-sm font-bold text-white">Listen again</button></div> : <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-violet-700">Listening comprehension</p><p className="mt-1 text-sm text-slate-500">Question {practiceStep + 1} of {listeningOrder.length}</p></div><button type="button" onClick={() => playListeningItem(listeningItem)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-sky-200 px-4 text-sm font-semibold text-blue-700"><Volume2 size={17}/> Play audio</button></div>
          <article className="rounded-3xl bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 text-center sm:p-9"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Headphones size={28}/></span><p className="mt-4 text-sm font-semibold text-slate-500">Listen to the English sentence and choose what it means.</p><p className="mt-2 text-xs text-slate-400">The transcript appears after you answer. You can replay the audio.</p></article>
          <AnswerChoiceList choices={listeningChoices} selectedAnswer={practiceAnswer} correctAnswer={listeningItem.example_vi} disabled={practiceAnswer !== null || saving} onSelect={(choice) => void recordListeningAnswer(listeningItem, choice)}/>
          {practiceAnswer !== null && <div className={`mt-4 rounded-2xl p-4 ${practiceAnswer === listeningItem.example_vi ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"}`}><p className="font-bold">{practiceAnswer === listeningItem.example_vi ? "Correct! You understood the sentence." : `Not quite. The meaning is “${listeningItem.example_vi}”.`}</p><p className="mt-2 text-sm">“{listeningItem.example_en}”</p><button type="button" onClick={nextPracticeQuestion} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white">Next sentence <ArrowRight size={16}/></button></div>}
        </>}
      </div>}
      {mode === "drills" && <div className="p-4 sm:p-7"><SentenceDrillView
        drill={currentDrill}
        step={drillStep}
        drillCount={sentenceDrills.length}
        answer={drillAnswer}
        orderedTiles={orderedTiles}
        saving={saving}
        onListen={(text, item) => item.audio_url ? new Audio(item.audio_url).play().catch(() => speak(text)) : speak(text)}
        onSubmit={(answer) => void submitSentenceDrill(answer)}
        onNext={nextSentenceDrill}
        onPracticeAgain={() => { setDrillStep(0); setDrillAnswer(null); setOrderedTiles([]); }}
        onOrderedTilesChange={setOrderedTiles}
      /></div>}
    </section>}
    <ConversationPractice dialogues={dialogues} onPlayTurn={playDialogueTurn}/>
  </main>;
}
