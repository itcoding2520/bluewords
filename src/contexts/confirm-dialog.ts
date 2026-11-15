import { createContext, useContext } from "react";

export type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type ConfirmFunction = (options: ConfirmDialogOptions) => Promise<boolean>;

export const ConfirmDialogContext = createContext<ConfirmFunction | null>(null);

export function useConfirmDialog() {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider.");
  return confirm;
}
