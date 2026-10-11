"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}