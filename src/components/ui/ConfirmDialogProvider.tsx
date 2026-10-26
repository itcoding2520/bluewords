"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";

export type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmDialogRequest = ConfirmDialogOptions & { id: number };
type ConfirmFunction = (options: ConfirmDialogOptions) => Promise<boolean>;

const ConfirmDialogContext = createContext<ConfirmFunction | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmDialogRequest | null>(null);
  const nextId = useRef(0);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const settle = useCallback((confirmed: boolean) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setRequest(null);
    resolve?.(confirmed);
  }, []);

  const confirm = useCallback<ConfirmFunction>((options) => new Promise((resolve) => {
    resolveRef.current?.(false);
    resolveRef.current = resolve;
    setRequest({ ...options, id: ++nextId.current });
  }), []);

  return <ConfirmDialogContext.Provider value={confirm}>
    {children}
    <Dialog.Root open={request !== null} onOpenChange={(open) => { if (!open) settle(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="confirm-dialog-overlay" />
        {request && <Dialog.Content className="confirm-dialog-content" aria-describedby={`confirm-description-${request.id}`}>
          <div className="confirm-dialog-heading">
            <span className={`confirm-dialog-icon${request.destructive === false ? " is-neutral" : ""}`}><AlertTriangle size={22} /></span>
            <div className="min-w-0">
              <Dialog.Title className="confirm-dialog-title">{request.title}</Dialog.Title>
              <Dialog.Description id={`confirm-description-${request.id}`} className="confirm-dialog-description">{request.description}</Dialog.Description>
            </div>
          </div>
          <div className="confirm-dialog-actions">
            <button type="button" className="confirm-dialog-cancel" onClick={() => settle(false)}>{request.cancelLabel ?? "Cancel"}</button>
            <button type="button" className={`confirm-dialog-submit${request.destructive === false ? " is-neutral" : ""}`} onClick={() => settle(true)}>{request.confirmLabel ?? "Confirm"}</button>
          </div>
        </Dialog.Content>}
      </Dialog.Portal>
    </Dialog.Root>
  </ConfirmDialogContext.Provider>;
}

export function useConfirmDialog() {
  const confirm = useContext(ConfirmDialogContext);
  if (!confirm) throw new Error("useConfirmDialog must be used within ConfirmDialogProvider.");
  return confirm;
}
