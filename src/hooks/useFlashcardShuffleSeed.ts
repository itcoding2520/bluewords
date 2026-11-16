"use client";

import { useSyncExternalStore } from "react";

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
