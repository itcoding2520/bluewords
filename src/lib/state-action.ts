import type { SetStateAction } from "react";

export function resolveStateAction<T>(current: T, action: SetStateAction<T>): T {
  return typeof action === "function"
    ? (action as (previous: T) => T)(current)
    : action;
}
