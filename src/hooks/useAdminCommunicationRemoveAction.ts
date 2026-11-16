import { toast } from "sonner";

import { useConfirmDialog } from "@/contexts/confirm-dialog";

type RemoveResult = { error: { message: string } | null };

export function useAdminCommunicationRemoveAction<T>({
  title,
  describe,
  remove,
  successMessage,
  refresh,
}: {
  title: string;
  describe: (item: T) => string;
  remove: (item: T) => PromiseLike<RemoveResult>;
  successMessage: string;
  refresh: () => Promise<void>;
}) {
  const confirm = useConfirmDialog();

  return async (item: T) => {
    if (!await confirm({ title, description: describe(item), confirmLabel: "Remove" })) return;

    const { error } = await remove(item);
    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(successMessage);
    await refresh();
  };
}
