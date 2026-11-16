import { useState, type Dispatch, type SetStateAction } from "react";

import type { Item, LessonMode } from "@/lib/communication/lesson-types";
import { shuffle } from "@/lib/random";
import { useStateField } from "@/hooks/useStateField";

export type { LessonMode };
type OrderedTile = { id: number; text: string };
type PracticeState = { step: number; answer: string | null };
type DrillState = { step: number; answer: string | null; orderedTiles: OrderedTile[] };

export function useSituationalEnglishLessonSession({
  items,
  setPracticeOrder,
}: {
  items: Item[];
  setPracticeOrder: Dispatch<SetStateAction<string[]>>;
}) {
  const [revealed, setRevealed] = useState(false);
  const [mode, setMode] = useState<LessonMode>("study");
  const [practice, setPractice] = useState<PracticeState>({ step: 0, answer: null });
  const [listeningOrder, setListeningOrder] = useState<string[]>([]);
  const [drills, setDrills] = useState<DrillState>({ step: 0, answer: null, orderedTiles: [] });

  const setPracticeStep = useStateField(setPractice, "step");
  const setPracticeAnswer = useStateField(setPractice, "answer");
  const setDrillAnswer = useStateField(setDrills, "answer");
  const setOrderedTiles = useStateField(setDrills, "orderedTiles");

  function selectMode(nextMode: LessonMode, listeningItemIds: string[]) {
    setMode(nextMode);
    if (nextMode === "practice") {
      setPracticeOrder(shuffle(items.map((item) => item.id)));
      setPractice({ step: 0, answer: null });
    }
    if (nextMode === "drills") {
      setDrills({ step: 0, answer: null, orderedTiles: [] });
    }
    if (nextMode === "listening") {
      setListeningOrder(shuffle(listeningItemIds));
      setPractice({ step: 0, answer: null });
    }
  }

  function nextSentenceDrill() {
    setDrills((current) => ({ ...current, step: current.step + 1, answer: null, orderedTiles: [] }));
  }

  function nextPracticeQuestion() {
    setPractice((current) => ({ ...current, step: current.step + 1, answer: null }));
  }

  function restartPractice() {
    setPracticeOrder(shuffle(items.map((item) => item.id)));
    setPractice({ step: 0, answer: null });
  }

  function restartListening(listeningItemIds: string[]) {
    setListeningOrder(shuffle(listeningItemIds));
    setPractice({ step: 0, answer: null });
  }

  function restartDrills() {
    setDrills({ step: 0, answer: null, orderedTiles: [] });
  }

  return {
    revealed,
    setRevealed,
    mode,
    practiceStep: practice.step,
    setPracticeStep,
    practiceAnswer: practice.answer,
    setPracticeAnswer,
    listeningOrder,
    drillStep: drills.step,
    drillAnswer: drills.answer,
    setDrillAnswer,
    orderedTiles: drills.orderedTiles,
    setOrderedTiles,
    selectMode,
    nextSentenceDrill,
    nextPracticeQuestion,
    restartPractice,
    restartListening,
    restartDrills,
  };
}
