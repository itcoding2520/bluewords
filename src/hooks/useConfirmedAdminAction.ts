import { useConfirmDialog, type ConfirmDialogOptions } from "@/contexts/confirm-dialog";

type ActionError = Pick<Error, "message">;

export function useConfirmedAdminAction<T>({
  confirmation,
  run,
  onError,
  onSuccess,
}: {
  confirmation: (item: T) => ConfirmDialogOptions;
  run: (item: T) => PromiseLike<ActionError | null>;
  onError: (error: ActionError) => void;
  onSuccess: (item: T) => void | Promise<void>;
}) {
  const confirm = useConfirmDialog();

  return async (item: T) => {
    if (!await confirm(confirmation(item))) return;

    const error = await run(item);
    if (error) {
      onError(error);
      return;
    }

    await onSuccess(item);
  };
}
