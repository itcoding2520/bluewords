import { useMemo } from "react";

import type { Item, ItemReview } from "@/lib/communication/lesson-types";
import { countMasteredLessonItems } from "@/lib/communication/lesson-progress";

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
    () => countMasteredLessonItems(items, reviews),
    [items, reviews],
  );

  return { currentItem, currentStatus, masteredCount };
}
