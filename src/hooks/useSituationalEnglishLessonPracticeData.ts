"use client";

import { useMemo } from "react";
import type { Item } from "@/lib/communication/lesson-types";
import { createAnswerChoices, createSentenceDrills } from "@/lib/communication/lesson-practice";

export function useSituationalEnglishLessonPracticeData({
  items,
  practiceOrder,
  practiceStep,
  listeningOrder,
  drillStep,
}: {
  items: Item[];
  practiceOrder: string[];
  practiceStep: number;
  listeningOrder: string[];
  drillStep: number;
}) {
  const practiceItem = items.find((item) => item.id === practiceOrder[practiceStep]);
  const listeningItems = useMemo(() => items.filter((item) => item.example_en.trim() && item.example_vi.trim()), [items]);
  const listeningItem = items.find((item) => item.id === listeningOrder[practiceStep]);
  const sentenceDrills = useMemo(() => createSentenceDrills(items), [items]);
  const currentDrill = sentenceDrills[drillStep];
  const practiceChoices = useMemo(() => practiceItem
    ? createAnswerChoices(practiceItem.meaning_vi, items.filter((item) => item.id !== practiceItem.id).map((item) => item.meaning_vi))
    : [], [practiceItem, items]);
  const listeningChoices = useMemo(() => listeningItem
    ? createAnswerChoices(listeningItem.example_vi, listeningItems.filter((item) => item.id !== listeningItem.id).map((item) => item.example_vi))
    : [], [listeningItem, listeningItems]);

  return {
    practiceItem,
    practiceChoices,
    practiceMeaningCount: new Set(items.map((item) => item.meaning_vi)).size,
    listeningItem,
    listeningItems,
    listeningChoices,
    listeningMeaningCount: new Set(listeningItems.map((item) => item.example_vi)).size,
    sentenceDrills,
    currentDrill,
  };
}
