import { useMemo } from "react";

import type { Item, ItemReview } from "@/lib/communication/lesson-types";

export function useSituationalEnglishLessonProgressData({
  items,
  reviews,
  currentIndex,
}: {
  items: Item[];
  reviews: Record<string, ItemReview>;
  currentIndex: number;
}) {
  const currentItem = items[currentIndex];
  const currentStatus = currentItem ? reviews[currentItem.id]?.status ?? "learning" : "learning";
  const masteredCount = useMemo(
    () => items.filter((item) => reviews[item.id]?.status === "mastered").length,
    [items, reviews],
  );

  return { currentItem, currentStatus, masteredCount };
}
