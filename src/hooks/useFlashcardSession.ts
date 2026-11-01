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

let currentShuffleSeed = 0;
const shuffleSeedListeners = new Set<() => void>();

function subscribeToShuffleSeed(listener: () => void) {
  shuffleSeedListeners.add(listener);

  if (shuffleSeedListeners.size === 1) {
    queueMicrotask(() => {
      currentShuffleSeed = Math.floor(Math.random() * 2 ** 32);
      shuffleSeedListeners.forEach((notify) => notify());
    });
  }

  return () => {
    shuffleSeedListeners.delete(listener);
  };
}

function getShuffleSeed() {
  return currentShuffleSeed;
}

export function useFlashcardShuffleSeed() {
  return useSyncExternalStore(subscribeToShuffleSeed, getShuffleSeed, () => 0);
}
