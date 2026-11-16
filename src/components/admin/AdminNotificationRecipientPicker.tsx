import { Search, Users } from "lucide-react";
import type { AdminNotificationRecipient } from "@/hooks/useAdminNotificationComposerController";

export function recipientInitials(recipient: AdminNotificationRecipient) {
  return (recipient.nickname || recipient.email || "U").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "U";
}

export function AdminNotificationRecipientPicker({
  recipients,
  allUsers,
  onAllUsersChange,
  search,
  onSearchChange,
  loading,
  filteredRecipients,
  selected,
  onRecipientToggle,
}: {
  recipients: AdminNotificationRecipient[];
  allUsers: boolean;
  onAllUsersChange: (value: boolean) => void;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  filteredRecipients: AdminNotificationRecipient[];
  selected: string[];
  onRecipientToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div>
      <div className="admin-notification-section-heading"><span className="admin-notification-heading-icon"><Users size={22} /></span><div><h2>Recipients</h2><p>Choose who should receive this notification.</p></div></div>
      <div className="admin-recipient-modes">
        <label className={!allUsers ? "is-selected" : ""}><input type="radio" name="recipient-mode" checked={!allUsers} onChange={() => onAllUsersChange(false)} />Choose users</label>
        <label className={allUsers ? "is-selected" : ""}><input type="radio" name="recipient-mode" checked={allUsers} onChange={() => onAllUsersChange(true)} />All users ({recipients.length})</label>
      </div>
      {!allUsers && (
        <div className="admin-recipient-list">
          <label className="admin-recipient-search"><Search size={16} /><input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search users…" aria-label="Search recipients" /></label>
          {loading ? <p className="p-4 text-sm text-slate-500">Loading users…</p> : (
            <div className="admin-recipient-scroll">
              {filteredRecipients.map((recipient) => (
                <label key={recipient.id} className="admin-recipient-row">
                  <input type="checkbox" checked={selected.includes(recipient.id)} onChange={(event) => onRecipientToggle(recipient.id, event.target.checked)} />
                  <span className="admin-recipient-avatar">{recipientInitials(recipient)}</span>
                  <span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{recipient.nickname || recipient.email || "User"}</span><span className="block truncate text-xs text-slate-500">{recipient.email}</span></span>
                </label>
              ))}
              {filteredRecipients.length === 0 && <p className="p-4 text-sm text-slate-500">No matching users.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
