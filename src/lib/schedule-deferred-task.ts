export function scheduleDeferredTask(task: () => void): () => void {
  const timer = window.setTimeout(task, 0);
  return () => window.clearTimeout(timer);
}
