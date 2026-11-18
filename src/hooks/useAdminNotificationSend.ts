import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { createAdminNotification } from "@/lib/admin-notifications-api";
import { runWithBusyState } from "@/lib/run-with-busy-state";

export function useAdminNotificationSend({
  recipients,
  selected,
  allUsers,
  setSelected,
  setAllUsers,
  setError,
  setNotice,
}: {
  recipients: Array<{ id: string }>;
  selected: string[];
  allUsers: boolean;
  setSelected: Dispatch<SetStateAction<string[]>>;
  setAllUsers: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string>>;
  setNotice: Dispatch<SetStateAction<string>>;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipientIds = allUsers ? recipients.map((recipient) => recipient.id) : selected;
    if (!recipientIds.length || sending) return;
    await runWithBusyState(setSending, async () => {
      setError("");
      setNotice("");
      try {
        const payload = await createAdminNotification({ title, message, recipientIds });
        setNotice(`Notification sent to ${payload.sent ?? 0} user(s).`);
        setTitle("");
        setMessage("");
        setSelected([]);
        setAllUsers(false);
      } catch (cause) {
        setError(getErrorMessage(cause, "Could not send notification."));
      }
    });
  }

  return { title, setTitle, message, setMessage, sending, sendNotification };
}
