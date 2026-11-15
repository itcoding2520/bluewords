import { getErrorMessage } from "@/lib/errors";
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
      setError(getErrorMessage(cause, "Could not send notification."));
    } finally {
      setSending(false);
    }
  }

  return {
    recipients: {
      recipients: recipientState.recipients,
      loading: recipientState.loading,
      filteredRecipients: recipientState.filteredRecipients,
      selectedRecipients: recipientState.selectedRecipients,
    },
    selection: {
      selected: recipientState.selected,
      setSelected: recipientState.setSelected,
      allUsers: recipientState.allUsers,
      setAllUsers: recipientState.setAllUsers,
      search: recipientState.search,
      setSearch: recipientState.setSearch,
      toggleRecipient: recipientState.toggleRecipient,
    },
    message: { title, setTitle, message, setMessage },
    status: { sending, error, notice },
    actions: { sendNotification },
  };
}
