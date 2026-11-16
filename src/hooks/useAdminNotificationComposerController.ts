import { useState } from "react";
import { useAdminNotificationRecipients } from "@/hooks/useAdminNotificationRecipients";
import { useAdminNotificationSend } from "@/hooks/useAdminNotificationSend";

export type { AdminNotificationRecipient } from "@/hooks/useAdminNotificationRecipients";

export function useAdminNotificationComposerController(currentUserId: string) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const recipientState = useAdminNotificationRecipients(currentUserId, setError);
  const messageState = useAdminNotificationSend({
    recipients: recipientState.recipients,
    selected: recipientState.selected,
    allUsers: recipientState.allUsers,
    setSelected: recipientState.setSelected,
    setAllUsers: recipientState.setAllUsers,
    setError,
    setNotice,
  });

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
    message: {
      title: messageState.title,
      setTitle: messageState.setTitle,
      message: messageState.message,
      setMessage: messageState.setMessage,
    },
    status: { sending: messageState.sending, error, notice },
    actions: { sendNotification: messageState.sendNotification },
  };
}
