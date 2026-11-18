export async function runWithBusyValue<TBusy, TResult>(
  setBusy: (busy: TBusy) => void,
  busyValue: TBusy,
  idleValue: TBusy,
  action: () => Promise<TResult>,
): Promise<TResult> {
  setBusy(busyValue);
  try {
    return await action();
  } finally {
    setBusy(idleValue);
  }
}

export function runWithBusyState<TResult>(
  setBusy: (busy: boolean) => void,
  action: () => Promise<TResult>,
): Promise<TResult> {
  return runWithBusyValue(setBusy, true, false, action);
}
