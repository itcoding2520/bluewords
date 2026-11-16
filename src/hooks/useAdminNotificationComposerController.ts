import { useFeedbackMessages } from "@/hooks/useFeedbackMessages";
import { useAdminNotificationRecipients } from "@/hooks/useAdminNotificationRecipients";
import { useAdminNotificationSend } from "@/hooks/useAdminNotificationSend";

export function useAdminNotificationComposerController(currentUserId: string) {
  const feedback = useFeedbackMessages();
  const recipientState = useAdminNotificationRecipients(currentUserId, feedback.setError);
  const messageState = useAdminNotificationSend({
    recipients: recipientState.recipients,
    selected: recipientState.selected,
    allUsers: recipientState.allUsers,
    setSelected: recipientState.setSelected,
    setAllUsers: recipientState.setAllUsers,
    setError: feedback.setError,
    setNotice: feedback.setNotice,
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
    status: { sending: messageState.sending, error: feedback.error, notice: feedback.notice },
    actions: { sendNotification: messageState.sendNotification },
  };
}
