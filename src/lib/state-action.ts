import type { Dispatch, SetStateAction } from "react";

export function resolveStateAction<T>(current: T, action: SetStateAction<T>): T {
  return typeof action === "function"
    ? (action as (previous: T) => T)(current)
    : action;
}

export function updateStateField<TState, TKey extends keyof TState>(
  setState: Dispatch<SetStateAction<TState>>,
  key: TKey,
  action: SetStateAction<TState[TKey]>,
) {
  setState((current) => ({
    ...current,
    [key]: resolveStateAction(current[key], action),
  }));
}
