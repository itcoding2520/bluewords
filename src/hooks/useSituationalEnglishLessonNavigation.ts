import { useCallback, useState } from "react";

import type { Item } from "@/lib/communication/lesson-types";
import { shuffled } from "@/lib/communication/lesson-practice";

export function useSituationalEnglishLessonNavigation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceOrder, setPracticeOrder] = useState<string[]>([]);

  const initializeNavigation = useCallback((items: Item[], reviewItem?: string) => {
    setPracticeOrder(shuffled(items.map((item) => item.id)));

    if (!reviewItem) return;

    const dueIndex = items.findIndex((item) => item.id === reviewItem);
    if (dueIndex >= 0) setCurrentIndex(dueIndex);
  }, []);

  return {
    currentIndex,
    setCurrentIndex,
    practiceOrder,
    setPracticeOrder,
    initializeNavigation,
  };
}
