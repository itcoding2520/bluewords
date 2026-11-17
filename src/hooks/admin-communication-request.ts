export async function runAdminCommunicationRequest<TError>(
  setBusy: (busy: boolean) => void,
  request: () => PromiseLike<{ error: TError | null }>,
): Promise<TError | null> {
  setBusy(true);
  const { error } = await request();
  setBusy(false);
  return error;
}
