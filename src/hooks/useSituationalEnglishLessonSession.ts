import { useState, type Dispatch, type SetStateAction } from "react";

import type { Item } from "@/lib/communication/lesson-types";
import { shuffled } from "@/lib/communication/lesson-practice";

export type LessonMode = "study" | "practice" | "drills" | "listening";
type OrderedTile = { id: number; text: string };

export function useSituationalEnglishLessonSession({
  items,
  setPracticeOrder,
}: {
  items: Item[];
  setPracticeOrder: Dispatch<SetStateAction<string[]>>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<LessonMode>("study");
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState<string | null>(null);
  const [listeningOrder, setListeningOrder] = useState<string[]>([]);
  const [drillStep, setDrillStep] = useState(0);
  const [drillAnswer, setDrillAnswer] = useState<string | null>(null);
  const [orderedTiles, setOrderedTiles] = useState<OrderedTile[]>([]);

  function selectMode(nextMode: LessonMode, listeningItemIds: string[]) {
    setMode(nextMode);
    if (nextMode === "practice") {
      setPracticeOrder(shuffled(items.map((item) => item.id)));
      setPracticeStep(0);
      setPracticeAnswer(null);
    }
    if (nextMode === "drills") {
      setDrillStep(0);
      setDrillAnswer(null);
      setOrderedTiles([]);
    }
    if (nextMode === "listening") {
      setListeningOrder(shuffled(listeningItemIds));
      setPracticeStep(0);
      setPracticeAnswer(null);
    }
  }

  function nextSentenceDrill() {
    setDrillAnswer(null);
    setOrderedTiles([]);
    setDrillStep((step) => step + 1);
  }

  function nextPracticeQuestion() {
    setPracticeAnswer(null);
    setPracticeStep((step) => step + 1);
  }

  function restartPractice() {
    setPracticeOrder(shuffled(items.map((item) => item.id)));
    setPracticeStep(0);
    setPracticeAnswer(null);
  }

  function restartListening(listeningItemIds: string[]) {
    setListeningOrder(shuffled(listeningItemIds));
    setPracticeStep(0);
    setPracticeAnswer(null);
  }

  function restartDrills() {
    setDrillStep(0);
    setDrillAnswer(null);
    setOrderedTiles([]);
  }

  return {
    revealed,
    setRevealed,
    mode,
    practiceStep,
    setPracticeStep,
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
  };
}
