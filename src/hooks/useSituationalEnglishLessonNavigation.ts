import { useCallback, useState } from "react";

import type { Item } from "@/lib/communication/lesson-types";
import { shuffle } from "@/lib/random";

export function useSituationalEnglishLessonNavigation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [practiceOrder, setPracticeOrder] = useState<string[]>([]);

  const initializeNavigation = useCallback((items: Item[], reviewItem?: string) => {
    setPracticeOrder(shuffle(items.map((item) => item.id)));

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
