"use client";

import { useSyncExternalStore } from "react";

let currentReviewTime = 0;
let reviewClockInterval: ReturnType<typeof setInterval> | null = null;
const reviewClockListeners = new Set<() => void>();

function subscribeToReviewClock(listener: () => void) {
  reviewClockListeners.add(listener);

  if (!reviewClockInterval) {
    const updateTime = () => {
      currentReviewTime = Date.now();
      reviewClockListeners.forEach((notify) => notify());
    };

    queueMicrotask(updateTime);
    reviewClockInterval = setInterval(updateTime, 60_000);
  }

  return () => {
    reviewClockListeners.delete(listener);
    if (reviewClockListeners.size === 0 && reviewClockInterval) {
      clearInterval(reviewClockInterval);
      reviewClockInterval = null;
    }
  };
}

function getReviewClockSnapshot() {
  return currentReviewTime;
}

export function useFlashcardReviewTime() {
  return useSyncExternalStore(
    subscribeToReviewClock,
    getReviewClockSnapshot,
    () => 0
  );
}
