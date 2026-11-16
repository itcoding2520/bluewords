import { getElapsedSeconds } from "@/lib/session-duration";

/** Calculate elapsed quiz time from its start timestamp, with a safe fallback. */
export function getQuizElapsedSeconds(
  startedAt: number | null,
  fallbackSeconds: number,
  now = Date.now()
): number {
  return startedAt === null ? fallbackSeconds : getElapsedSeconds(startedAt, now);
}
