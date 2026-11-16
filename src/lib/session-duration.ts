export function getDurationSeconds(startedAt: number, completedAt: number): number {
  return Math.max(0, Math.floor((completedAt - startedAt) / 1000));
}

export function getElapsedSeconds(startedAt: number, now = Date.now()): number {
  return Math.floor((now - startedAt) / 1000);
}
