import { getErrorMessage } from "@/lib/errors";
import { useState } from "react";
import { toast } from "sonner";

export function usePublishVocabularySubmission(refreshRequests: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function sendRequests<T>(
    selected: T[],
    publish: (item: T) => Promise<void>,
    clearSelection: () => void,
    fallbackMessage: string,
  ) {
    if (!selected.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selected) await publish(item);
      clearSelection();
      await refreshRequests();
    } catch (error) {
      toast.error(getErrorMessage(error, fallbackMessage));
    } finally {
      setBusy(false);
    }
  }

  return { busy, status, setStatus, sendRequests };
}
