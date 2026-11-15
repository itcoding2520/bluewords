"use client";

import { MessageSquareText, Pencil, Send } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useAdminNotificationComposerController } from "@/hooks/useAdminNotificationComposerController";
import { AdminNotificationRecipientPicker } from "@/components/admin/AdminNotificationRecipientPicker";
import { AdminNotificationPreview } from "@/components/admin/AdminNotificationPreview";

export function AdminNotificationComposer({ currentUserId }: { currentUserId: string }) {
  const {
    recipients: { recipients, loading, filteredRecipients, selectedRecipients },
    selection: {
      selected, allUsers, setAllUsers, search, setSearch, toggleRecipient,
    },
    message: { title, setTitle, message, setMessage },
    status: { sending, error, notice },
    actions: { sendNotification },
  } = useAdminNotificationComposerController(currentUserId);

  return <div className="admin-notification-page">
    <AdminNavigation active="notifications" />
    <header className="admin-notification-hero mb-6"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">Send notification</h1><p className="page-intro-description mt-2">Send an in-app message to one or more users. Your own account is excluded.</p></header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4 whitespace-pre-line">{error}</AutoDismissMessage>}
    {notice && <AutoDismissMessage key={notice} variant="success" className="mb-4">{notice}</AutoDismissMessage>}
    <form onSubmit={(event) => void sendNotification(event)} className="admin-notification-layout">
      <section className="admin-notification-form-card">
        <AdminNotificationRecipientPicker
          recipients={recipients}
          allUsers={allUsers}
          onAllUsersChange={setAllUsers}
          search={search}
          onSearchChange={setSearch}
          loading={loading}
          filteredRecipients={filteredRecipients}
          selected={selected}
          onRecipientToggle={toggleRecipient}
        />
        <label className="admin-notification-field admin-title-field"><span className="admin-notification-field-icon"><Pencil size={19} /></span><span className="admin-notification-field-label">Title</span><input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Notification title" /></label>
        <label className="admin-notification-field admin-message-field"><span className="admin-notification-field-icon"><MessageSquareText size={19} /></span><span className="admin-notification-field-label">Message</span><textarea required maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your message…" /><span className="admin-notification-counter">{message.length}/2000</span></label>
        <div className="admin-notification-submit"><p>{allUsers ? `${recipients.length} recipient(s)` : `${selected.length} selected`}</p><Button type="submit" disabled={sending || loading || recipients.length === 0 || (!allUsers && selected.length === 0)}><Send size={16} />{sending ? "Sending…" : "Send notification"}</Button></div>
      </section>
      <AdminNotificationPreview
        title={title}
        message={message}
        recipients={recipients}
        selected={selected}
        selectedRecipients={selectedRecipients}
        allUsers={allUsers}
      />
    </form>
  </div>;
}
