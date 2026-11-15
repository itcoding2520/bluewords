import { useState, type FormEvent } from "react";
import { createAdminNotification } from "@/lib/admin-notifications-api";
import { useAdminNotificationRecipients } from "@/hooks/useAdminNotificationRecipients";

export type { AdminNotificationRecipient } from "@/hooks/useAdminNotificationRecipients";

export function useAdminNotificationComposerController(currentUserId: string) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const recipientState = useAdminNotificationRecipients(currentUserId, setError);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipientIds = recipientState.allUsers
      ? recipientState.recipients.map((recipient) => recipient.id)
      : recipientState.selected;
    if (!recipientIds.length || sending) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const payload = await createAdminNotification({ title, message, recipientIds });
      setNotice(`Notification sent to ${payload.sent ?? 0} user(s).`);
      setTitle("");
      setMessage("");
      recipientState.setSelected([]);
      recipientState.setAllUsers(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  return {
    ...recipientState,
    title, setTitle, message, setMessage, sending, error, notice, sendNotification,
  };
}
