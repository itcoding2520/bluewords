"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";

import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { playCommunicationAudio } from "@/lib/communication/audio";
import { useSituationalEnglishLessonData } from "@/hooks/useSituationalEnglishLessonData";
import { useSituationalEnglishLessonPracticeData } from "@/hooks/useSituationalEnglishLessonPracticeData";
import { useCommunicationLessonReviewActions } from "@/hooks/useCommunicationLessonReviewActions";
import { ConversationPractice } from "@/components/communication/ConversationPractice";
import { LessonModeContent } from "@/components/communication/LessonModeContent";
import { LessonProgressHeader } from "@/components/communication/LessonProgressHeader";
import { LessonModeTabs } from "@/components/communication/LessonModeTabs";
import { LessonAvailabilityState } from "@/components/communication/LessonAvailabilityState";
import { useSituationalEnglishLessonSession } from "@/hooks/useSituationalEnglishLessonSession";
import { useSituationalEnglishLessonAnswerActions } from "@/hooks/useSituationalEnglishLessonAnswerActions";
import { useSituationalEnglishLessonProgressData } from "@/hooks/useSituationalEnglishLessonProgressData";

export function SituationalEnglishLesson({ lessonId, reviewItem }: { lessonId: string; reviewItem?: string }) {
  const supabase = useSupabaseClient();
  const { lesson, topic, items, dialogues, reviews, setReviews, userId, loading, currentIndex, setCurrentIndex, practiceOrder, setPracticeOrder } = useSituationalEnglishLessonData(supabase, lessonId, reviewItem);
  const { saving, setItemStatus, recordPracticeOutcome } = useCommunicationLessonReviewActions({ supabase, lessonId, lesson, items, reviews, setReviews, userId });
  const session = useSituationalEnglishLessonSession({ items, setPracticeOrder });
  const {
    revealed,
    setRevealed,
    mode,
    practiceStep,
    practiceAnswer,
    setPracticeAnswer,
    listeningOrder,
    drillStep,
    drillAnswer,
    setDrillAnswer,
    orderedTiles,
    setOrderedTiles,
    selectMode,
    nextSentenceDrill,
    nextPracticeQuestion,
    restartPractice,
    restartListening,
    restartDrills,
  } = session;
  const { currentItem, currentStatus, masteredCount } = useSituationalEnglishLessonProgressData({ items, reviews, currentIndex });
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
  const { recordMeaningAnswer, recordListeningAnswer, submitSentenceDrill } = useSituationalEnglishLessonAnswerActions({
    answer: practiceAnswer,
    setAnswer: setPracticeAnswer,
    drillAnswer,
    setDrillAnswer,
    currentDrill,
    saving,
    recordPracticeOutcome,
  });

  if (loading) return <LessonAvailabilityState state="loading" />;
  if (!lesson || !topic) return <LessonAvailabilityState state="unavailable" />;

  return <main className="space-y-5">
    <Link href="/communication" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-bold text-white"><ArrowLeft size={17}/> All situations</Link>
    <LessonProgressHeader lesson={lesson} topic={topic} masteredCount={masteredCount} itemCount={items.length}/>
    {!userId && <aside className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><LockKeyhole size={18}/> Sign in to record completed items and build your review schedule. <Link href="/login" className="font-bold underline">Log in</Link></aside>}
    {items.length === 0 ? <LessonAvailabilityState state="empty" /> : <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
      <LessonModeTabs
        mode={mode}
        practiceDisabled={practiceMeaningCount < 2}
        drillsDisabled={sentenceDrills.length === 0}
        listeningDisabled={listeningMeaningCount < 2}
        onSelect={(selectedMode) => {
          selectMode(selectedMode, listeningItems.map((item) => item.id));
        }}
      />
      <LessonModeContent
        mode={mode}
        study={{
          item: currentItem,
          index: currentIndex,
          itemCount: items.length,
          revealed,
          status: currentStatus,
          saving,
          onReveal: () => setRevealed(true),
          onStatusChange: (status) => void setItemStatus(currentItem, status),
          onPrevious: () => { setCurrentIndex((index) => index - 1); setRevealed(false); },
          onNext: () => { setCurrentIndex((index) => index + 1); setRevealed(false); },
          onListen: () => playCommunicationAudio(currentItem.audio_url, currentItem.example_en || currentItem.content_en),
        }}
        practice={{
          item: practiceItem,
          question: practiceStep,
          questionCount: practiceOrder.length,
          choices: practiceChoices,
          answer: practiceAnswer,
          saving,
          onListen: (item) => playCommunicationAudio(item.audio_url, item.content_en),
          onSelect: (answer) => { if (practiceItem) void recordMeaningAnswer(practiceItem, answer); },
          onNext: nextPracticeQuestion,
          onPracticeAgain: restartPractice,
        }}
        listening={{
          item: listeningItem,
          question: practiceStep,
          questionCount: listeningOrder.length,
          choices: listeningChoices,
          answer: practiceAnswer,
          saving,
          onListen: (item) => playCommunicationAudio(item.audio_url, item.example_en),
          onSelect: (answer) => { if (listeningItem) void recordListeningAnswer(listeningItem, answer); },
          onNext: nextPracticeQuestion,
          onListenAgain: () => restartListening(listeningItems.map((item) => item.id)),
        }}
        drills={{
          drill: currentDrill,
          step: drillStep,
          drillCount: sentenceDrills.length,
          answer: drillAnswer,
          orderedTiles,
          saving,
          onListen: (text, item) => playCommunicationAudio(item.audio_url, text),
          onSubmit: (answer) => void submitSentenceDrill(answer),
          onNext: nextSentenceDrill,
          onPracticeAgain: restartDrills,
          onOrderedTilesChange: setOrderedTiles,
        }}
      />
    </section>}
    <ConversationPractice dialogues={dialogues} onPlayTurn={(turn) => playCommunicationAudio(turn.audio_url, turn.text_en)}/>
  </main>;
}
