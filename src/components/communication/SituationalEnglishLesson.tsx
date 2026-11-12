"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { normalizeSentence, shuffled } from "@/lib/communication/lesson-practice";
import { useSituationalEnglishLessonData, type Item, type Turn } from "@/hooks/useSituationalEnglishLessonData";
import { useSituationalEnglishLessonPracticeData } from "@/hooks/useSituationalEnglishLessonPracticeData";
import { useCommunicationLessonReviewActions } from "@/hooks/useCommunicationLessonReviewActions";
import { ConversationPractice } from "@/components/communication/ConversationPractice";
import { StudyCardView } from "@/components/communication/StudyCardView";
import { SentenceDrillView } from "@/components/communication/SentenceDrillView";
import { ListeningPracticeView } from "@/components/communication/ListeningPracticeView";
import { QuickPracticeView } from "@/components/communication/QuickPracticeView";
import { LessonProgressHeader } from "@/components/communication/LessonProgressHeader";
import { LessonModeTabs } from "@/components/communication/LessonModeTabs";
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
  const { saving, setItemStatus, recordPracticeOutcome } = useCommunicationLessonReviewActions({ supabase, lessonId, lesson, items, reviews, setReviews, userId });
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<"study" | "practice" | "drills" | "listening">("study");
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [listeningOrder, setListeningOrder] = useState<string[]>([]);
  const [drillStep, setDrillStep] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState<string | null>(null);
  const [orderedTiles, setOrderedTiles] = useState<Array<{ id: number; text: string }>>([]);
  const currentItem = items[currentIndex];
  const currentStatus = currentItem ? reviews[currentItem.id]?.status ?? "learning" : "learning";
  const masteredCount = items.filter((item) => reviews[item.id]?.status === "mastered").length;
  const {
    practiceItem,
    practiceChoices,
    practiceMeaningCount,
    listeningItem,
    listeningItems,
    listeningChoices,
    listeningMeaningCount,
    sentenceDrills,
    currentDrill,
  } = useSituationalEnglishLessonPracticeData({ items, practiceOrder, practiceStep, listeningOrder, drillStep });

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

  function playDialogueTurn(turn: Turn) {
    if (turn.audio_url) new Audio(turn.audio_url).play().catch(() => speak(turn.text_en));
    else speak(turn.text_en);
  }

  if (loading) return <main className="rounded-3xl border border-sky-100 bg-white p-8 text-center text-slate-500">Loading lesson…</main>;
  if (!lesson || !topic) return <main className="rounded-3xl border border-amber-200 bg-amber-50 p-6"><h1 className="text-xl font-bold text-slate-900">Lesson unavailable</h1><p className="mt-2 text-sm text-slate-600">This lesson may be unpublished or removed.</p><Link className="mt-4 inline-flex font-bold text-blue-700" href="/communication"><ArrowLeft size={17}/> Back to situations</Link></main>;

  return <main className="space-y-5">
    <Link href="/communication" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white"><ArrowLeft size={17}/> All situations</Link>
    <LessonProgressHeader lesson={lesson} topic={topic} masteredCount={masteredCount} itemCount={items.length}/>
    {!userId && <aside className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole size={18}/> Sign in to record completed items and build your review schedule. <Link href="/login" className="font-bold underline">Log in</Link></aside>}
    {items.length === 0 ? <section className="rounded-3xl border border-dashed border-sky-200 bg-white p-10 text-center"><BookOpen className="mx-auto text-blue-400" size={34}/><p className="mt-3 font-bold text-slate-900">This lesson is being prepared</p><p className="mt-1 text-sm text-slate-500">Learning items will appear here when they are added.</p></section> : <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <LessonModeTabs
        mode={mode}
        practiceDisabled={practiceMeaningCount < 2}
        drillsDisabled={sentenceDrills.length === 0}
        listeningDisabled={listeningMeaningCount < 2}
        onSelect={(selectedMode) => {
          setMode(selectedMode);
          if (selectedMode === "practice") { setPracticeOrder(shuffled(items.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }
          if (selectedMode === "drills") { setDrillStep(0); setDrillAnswer(null); setOrderedTiles([]); }
          if (selectedMode === "listening") { setListeningOrder(shuffled(listeningItems.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }
        }}
      />
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
      {mode === "practice" && <div className="p-4 sm:p-7"><QuickPracticeView
        item={practiceItem}
        question={practiceStep}
        questionCount={practiceOrder.length}
        choices={practiceChoices}
        answer={practiceAnswer}
        saving={saving}
        onListen={(item) => item.audio_url ? new Audio(item.audio_url).play().catch(() => speak(item.content_en)) : speak(item.content_en)}
        onSelect={(answer) => { if (practiceItem) void recordPracticeAnswer(practiceItem, answer); }}
        onNext={nextPracticeQuestion}
        onPracticeAgain={() => { setPracticeOrder(shuffled(items.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }}
      /></div>}
      {mode === "listening" && <div className="p-4 sm:p-7"><ListeningPracticeView
        item={listeningItem}
        question={practiceStep}
        questionCount={listeningOrder.length}
        choices={listeningChoices}
        answer={practiceAnswer}
        saving={saving}
        onListen={playListeningItem}
        onSelect={(answer) => { if (listeningItem) void recordListeningAnswer(listeningItem, answer); }}
        onNext={nextPracticeQuestion}
        onListenAgain={() => { setListeningOrder(shuffled(listeningItems.map((item) => item.id))); setPracticeStep(0); setPracticeAnswer(null); }}
      /></div>}
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
