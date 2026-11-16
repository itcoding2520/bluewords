import { Bell, Eye, Info, Users } from "lucide-react";
import type { AdminNotificationRecipient } from "@/lib/admin-notification-recipients";
import { getAdminNotificationRecipientInitials } from "@/lib/admin-notification-recipients";

export function AdminNotificationPreview({
  title,
  message,
  recipients,
  selected,
  selectedRecipients,
  allUsers,
}: {
  title: string;
  message: string;
  recipients: AdminNotificationRecipient[];
  selected: string[];
  selectedRecipients: AdminNotificationRecipient[];
  allUsers: boolean;
}) {
  return (
    <aside className="admin-notification-aside">
      <section className="admin-notification-preview-card">
        <div className="admin-notification-section-heading"><span className="admin-notification-heading-icon preview"><Eye size={22} /></span><div><h2>Message preview</h2><p>This is how your notification will look in the app.</p></div></div>
        <div className="admin-notification-preview">
          <span className="admin-notification-app-icon"><Bell size={23} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2"><strong>BlueWords</strong><span>now</span></div>
            <h3>{title || "Notification title"}</h3>
            <p>{message || "Your message will appear here…"}</p>
          </div>
        </div>
      </section>
      <section className="admin-notification-selected-card">
        <div className="admin-notification-section-heading">
          <span className="admin-notification-heading-icon selected"><Users size={22} /></span>
          <div><h2>Selected recipients</h2><p>{allUsers ? `${recipients.length} users will receive this` : `${selected.length} selected`}</p></div>
        </div>
        {allUsers ? (
          <div className="admin-selected-summary">
            <span className="admin-selected-avatar-stack">{recipients.slice(0, 4).map((recipient) => <span key={recipient.id}>{getAdminNotificationRecipientInitials(recipient)}</span>)}</span>
            <strong>All users</strong>
          </div>
        ) : selectedRecipients.length ? (
          <ul className="admin-selected-list">
            {selectedRecipients.slice(0, 5).map((recipient) => (
              <li key={recipient.id}>
                <span className="admin-recipient-avatar">{getAdminNotificationRecipientInitials(recipient)}</span>
                <span className="min-w-0"><strong>{recipient.nickname || recipient.email || "User"}</strong><small>{recipient.email}</small></span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="admin-selected-empty"><span className="admin-selected-empty-icon"><Users size={28} /></span><strong>No recipients selected</strong><p>Choose one or more users from the list or select all users.</p></div>
        )}
      </section>
      <div className="admin-notification-info"><Info size={21} /><p>Notifications appear in each recipient&apos;s in-app Notifications page.</p></div>
    </aside>
  );
}
