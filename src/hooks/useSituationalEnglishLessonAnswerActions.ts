import type { Dispatch, SetStateAction } from "react";

import type { Item } from "@/hooks/useSituationalEnglishLessonData";
import type { SentenceDrill } from "@/lib/communication/lesson-practice";
import { normalizeSentence } from "@/lib/communication/lesson-practice";

export function useSituationalEnglishLessonAnswerActions({
  answer,
  setAnswer,
  drillAnswer,
  setDrillAnswer,
  currentDrill,
  saving,
  recordPracticeOutcome,
}: {
  answer: string | null;
  setAnswer: Dispatch<SetStateAction<string | null>>;
  drillAnswer: string | null;
  setDrillAnswer: Dispatch<SetStateAction<string | null>>;
  currentDrill: SentenceDrill<Item> | undefined;
  saving: boolean;
  recordPracticeOutcome: (item: Item, correct: boolean) => Promise<void>;
}) {
  async function recordMeaningAnswer(item: Item, selectedAnswer: string) {
    if (answer !== null || saving) return;
    setAnswer(selectedAnswer);
    await recordPracticeOutcome(item, selectedAnswer === item.meaning_vi);
  }

  async function recordListeningAnswer(item: Item, selectedAnswer: string) {
    if (answer !== null || saving) return;
    setAnswer(selectedAnswer);
    await recordPracticeOutcome(item, selectedAnswer === item.example_vi);
  }

  async function submitSentenceDrill(selectedAnswer: string) {
    if (!currentDrill || drillAnswer !== null || saving) return;
    setDrillAnswer(selectedAnswer);
    await recordPracticeOutcome(
      currentDrill.item,
      normalizeSentence(selectedAnswer) === normalizeSentence(currentDrill.answer),
    );
  }

  return { recordMeaningAnswer, recordListeningAnswer, submitSentenceDrill };
}
