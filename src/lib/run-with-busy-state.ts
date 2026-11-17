export async function runWithBusyState<T>(
  setBusy: (busy: boolean) => void,
  action: () => Promise<T>,
): Promise<T> {
  setBusy(true);
  try {
    return await action();
  } finally {
    setBusy(false);
  }
}
