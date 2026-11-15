"use client";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useSituationalEnglishLessonData } from "@/hooks/useSituationalEnglishLessonData";
import { useSituationalEnglishLessonPracticeData } from "@/hooks/useSituationalEnglishLessonPracticeData";
import { useCommunicationLessonReviewActions } from "@/hooks/useCommunicationLessonReviewActions";
import { useSituationalEnglishLessonSession } from "@/hooks/useSituationalEnglishLessonSession";
import { useSituationalEnglishLessonAnswerActions } from "@/hooks/useSituationalEnglishLessonAnswerActions";
import { useSituationalEnglishLessonProgressData } from "@/hooks/useSituationalEnglishLessonProgressData";
import { playCommunicationAudio } from "@/lib/communication/audio";

export function useSituationalEnglishLessonController(lessonId: string, reviewItem?: string) {
  const supabase = useSupabaseClient();
  const {
    lesson,
    topic,
    items,
    dialogues,
    reviews,
    setReviews,
    userId,
    loading,
    currentIndex,
    setCurrentIndex,
    practiceOrder,
    setPracticeOrder,
  } = useSituationalEnglishLessonData(supabase, lessonId, reviewItem);
  const { saving, setItemStatus, recordPracticeOutcome } = useCommunicationLessonReviewActions({
    supabase,
    lessonId,
    lesson,
    items,
    reviews,
    setReviews,
    userId,
  });
  const session = useSituationalEnglishLessonSession({ items, setPracticeOrder });
  const progress = useSituationalEnglishLessonProgressData({ items, reviews, currentIndex });
  const practice = useSituationalEnglishLessonPracticeData({
    items,
    practiceOrder,
    practiceStep: session.practiceStep,
    listeningOrder: session.listeningOrder,
    drillStep: session.drillStep,
  });
  const answers = useSituationalEnglishLessonAnswerActions({
    answer: session.practiceAnswer,
    setAnswer: session.setPracticeAnswer,
    drillAnswer: session.drillAnswer,
    setDrillAnswer: session.setDrillAnswer,
    currentDrill: practice.currentDrill,
    saving,
    recordPracticeOutcome,
  });

  return {
    lesson,
    topic,
    items,
    dialogues,
    userId,
    loading,
    masteredCount: progress.masteredCount,
    mode: session.mode,
    onSelectMode: (mode: typeof session.mode) => {
      session.selectMode(mode, practice.listeningItems.map((item) => item.id));
    },
    tabs: {
      practiceDisabled: practice.practiceMeaningCount < 2,
      drillsDisabled: practice.sentenceDrills.length === 0,
      listeningDisabled: practice.listeningMeaningCount < 2,
    },
    modes: {
      study: {
        item: progress.currentItem,
        index: currentIndex,
        itemCount: items.length,
        revealed: session.revealed,
        status: progress.currentStatus,
        saving,
        onReveal: () => session.setRevealed(true),
        onStatusChange: (status: "learning" | "mastered") => void setItemStatus(progress.currentItem, status),
        onPrevious: () => { setCurrentIndex((index) => index - 1); session.setRevealed(false); },
        onNext: () => { setCurrentIndex((index) => index + 1); session.setRevealed(false); },
        onListen: () => playCommunicationAudio(progress.currentItem.audio_url, progress.currentItem.example_en || progress.currentItem.content_en),
      },
      practice: {
        item: practice.practiceItem,
        question: session.practiceStep,
        questionCount: practiceOrder.length,
        choices: practice.practiceChoices,
        answer: session.practiceAnswer,
        saving,
        onListen: (item: typeof items[number]) => playCommunicationAudio(item.audio_url, item.content_en),
        onSelect: (answer: string) => { if (practice.practiceItem) void answers.recordMeaningAnswer(practice.practiceItem, answer); },
        onNext: session.nextPracticeQuestion,
        onPracticeAgain: session.restartPractice,
      },
      listening: {
        item: practice.listeningItem,
        question: session.practiceStep,
        questionCount: session.listeningOrder.length,
        choices: practice.listeningChoices,
        answer: session.practiceAnswer,
        saving,
        onListen: (item: typeof items[number]) => playCommunicationAudio(item.audio_url, item.example_en),
        onSelect: (answer: string) => { if (practice.listeningItem) void answers.recordListeningAnswer(practice.listeningItem, answer); },
        onNext: session.nextPracticeQuestion,
        onListenAgain: () => session.restartListening(practice.listeningItems.map((item) => item.id)),
      },
      drills: {
        drill: practice.currentDrill,
        step: session.drillStep,
        drillCount: practice.sentenceDrills.length,
        answer: session.drillAnswer,
        orderedTiles: session.orderedTiles,
        saving,
        onListen: (text: string, item: typeof items[number]) => playCommunicationAudio(item.audio_url, text),
        onSubmit: (answer: string) => void answers.submitSentenceDrill(answer),
        onNext: session.nextSentenceDrill,
        onPracticeAgain: session.restartDrills,
        onOrderedTilesChange: session.setOrderedTiles,
      },
    },
    onPlayTurn: (turn: typeof dialogues[number]["turns"][number]) => playCommunicationAudio(turn.audio_url, turn.text_en),
  };
}
