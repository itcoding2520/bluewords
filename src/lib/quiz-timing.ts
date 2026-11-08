/** Calculate elapsed quiz time from its start timestamp, with a safe fallback. */
export function getQuizElapsedSeconds(
  startedAt: number | null,
  fallbackSeconds: number,
  now = Date.now()
): number {
  return startedAt === null ? fallbackSeconds : Math.floor((now - startedAt) / 1000);
}
