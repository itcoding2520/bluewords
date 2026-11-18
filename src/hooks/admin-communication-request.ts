import { runWithBusyState } from "@/lib/run-with-busy-state";

export async function runAdminCommunicationRequest<TError>(
  setBusy: (busy: boolean) => void,
  request: () => PromiseLike<{ error: TError | null }>,
): Promise<TError | null> {
  return runWithBusyState(setBusy, async () => {
    const { error } = await request();
    return error;
  });
}
