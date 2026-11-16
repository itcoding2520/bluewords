"use client";

import { useMemo } from "react";
import type { Item } from "@/lib/communication/lesson-types";
import { createAnswerChoices, createSentenceDrills } from "@/lib/communication/lesson-practice";

function getOtherItemValues(items: Item[], currentItemId: string, getValue: (item: Item) => string) {
  const values: string[] = [];
  for (const item of items) {
    if (item.id !== currentItemId) values.push(getValue(item));
  }
  return values;
}

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
  const itemsById = useMemo(() => {
    const indexed = new Map<string, Item>();
    for (const item of items) {
      if (!indexed.has(item.id)) indexed.set(item.id, item);
    }
    return indexed;
  }, [items]);
  const practiceItem = itemsById.get(practiceOrder[practiceStep]);
  const listeningItems = useMemo(() => items.filter((item) => item.example_en.trim() && item.example_vi.trim()), [items]);
  const listeningItem = itemsById.get(listeningOrder[practiceStep]);
  const sentenceDrills = useMemo(() => createSentenceDrills(items), [items]);
  const currentDrill = sentenceDrills[drillStep];
  const practiceMeaningCount = useMemo(() => new Set(items.map((item) => item.meaning_vi)).size, [items]);
  const listeningMeaningCount = useMemo(() => new Set(listeningItems.map((item) => item.example_vi)).size, [listeningItems]);
  const practiceChoices = useMemo(() => practiceItem
    ? createAnswerChoices(practiceItem.meaning_vi, getOtherItemValues(items, practiceItem.id, (item) => item.meaning_vi))
    : [], [practiceItem, items]);
  const listeningChoices = useMemo(() => listeningItem
    ? createAnswerChoices(listeningItem.example_vi, getOtherItemValues(listeningItems, listeningItem.id, (item) => item.example_vi))
    : [], [listeningItem, listeningItems]);

  return {
    practiceItem,
    practiceChoices,
    practiceMeaningCount,
    listeningItem,
    listeningItems,
    listeningChoices,
    listeningMeaningCount,
    sentenceDrills,
    currentDrill,
  };
}
