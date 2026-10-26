"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, Eye, Info, MessageSquareText, Pencil, Search, Send, Users } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Button } from "@/components/ui/Button";
import { getAdminCachedData } from "@/lib/admin-data-cache.mjs";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type Recipient = { id: string; email: string | null; nickname: string };

function recipientInitials(recipient: Recipient) {
  return (recipient.nickname || recipient.email || "U").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase() || "U";
}

export function AdminNotificationComposer({ currentUserId }: { currentUserId: string }) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRecipients() {
      try {
        const query = new URLSearchParams({ page: "1", pageSize: "100", all: "true" });
        const payload = await getAdminCachedData("admin:users:all-recipients", async () => {
          const response = await fetch(`/api/admin/users?${query}`, { cache: "no-store" });
          const result = await response.json() as { users?: Recipient[]; error?: string };
          if (!response.ok) throw new Error(result.error ?? "Could not load users.");
          return result;
        }) as { users?: Recipient[]; error?: string };
        if (active) setRecipients((payload.users ?? []).filter((recipient) => recipient.id !== currentUserId));
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Could not load users.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadRecipients();
    return () => { active = false; };
  }, [currentUserId]);

  const filteredRecipients = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    if (!normalized) return recipients;
    return recipients.filter((recipient) => `${recipient.email ?? ""} ${recipient.nickname}`.toLocaleLowerCase().includes(normalized));
  }, [recipients, search]);
  const selectedRecipients = useMemo(() => recipients.filter((recipient) => selected.includes(recipient.id)), [recipients, selected]);

  async function sendNotification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipientIds = allUsers ? recipients.map((recipient) => recipient.id) : selected;
    if (!recipientIds.length || sending) return;
    setSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, recipientIds }),
      });
      const payload = await response.json() as { sent?: number; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Could not send notification.");
      setNotice(`Notification sent to ${payload.sent ?? 0} user(s).`);
      setTitle("");
      setMessage("");
      setSelected([]);
      setAllUsers(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not send notification.");
    } finally {
      setSending(false);
    }
  }

  return <div className="admin-notification-page">
    <AdminNavigation active="notifications" />
    <header className="admin-notification-hero mb-6"><p className="text-sm font-semibold text-blue-600">Administration</p><h1 className="page-title mt-1">Send notification</h1><p className="page-intro-description mt-2">Send an in-app message to one or more users. Your own account is excluded.</p></header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4 whitespace-pre-line">{error}</AutoDismissMessage>}
    {notice && <AutoDismissMessage key={notice} variant="success" className="mb-4">{notice}</AutoDismissMessage>}
    <form onSubmit={(event) => void sendNotification(event)} className="admin-notification-layout">
      <section className="admin-notification-form-card">
        <div className="admin-notification-section-heading"><span className="admin-notification-heading-icon"><Users size={22} /></span><div><h2>Recipients</h2><p>Choose who should receive this notification.</p></div></div>
        <div className="admin-recipient-modes">
          <label className={!allUsers ? "is-selected" : ""}><input type="radio" name="recipient-mode" checked={!allUsers} onChange={() => setAllUsers(false)} />Choose users</label>
          <label className={allUsers ? "is-selected" : ""}><input type="radio" name="recipient-mode" checked={allUsers} onChange={() => setAllUsers(true)} />All users ({recipients.length})</label>
        </div>
        {!allUsers && <div className="admin-recipient-list">
          <label className="admin-recipient-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users…" aria-label="Search recipients" /></label>
          {loading ? <p className="p-4 text-sm text-slate-500">Loading users…</p> : <div className="admin-recipient-scroll">{filteredRecipients.map((recipient) => <label key={recipient.id} className="admin-recipient-row"><input type="checkbox" checked={selected.includes(recipient.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, recipient.id] : current.filter((id) => id !== recipient.id))} /><span className="admin-recipient-avatar">{recipientInitials(recipient)}</span><span className="min-w-0"><span className="block truncate font-semibold text-slate-800">{recipient.nickname || recipient.email || "User"}</span><span className="block truncate text-xs text-slate-500">{recipient.email}</span></span></label>)}{filteredRecipients.length === 0 && <p className="p-4 text-sm text-slate-500">No matching users.</p>}</div>}
        </div>}
        <label className="admin-notification-field admin-title-field"><span className="admin-notification-field-icon"><Pencil size={19} /></span><span className="admin-notification-field-label">Title</span><input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Notification title" /></label>
        <label className="admin-notification-field admin-message-field"><span className="admin-notification-field-icon"><MessageSquareText size={19} /></span><span className="admin-notification-field-label">Message</span><textarea required maxLength={2000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your message…" /><span className="admin-notification-counter">{message.length}/2000</span></label>
        <div className="admin-notification-submit"><p>{allUsers ? `${recipients.length} recipient(s)` : `${selected.length} selected`}</p><Button type="submit" disabled={sending || loading || recipients.length === 0 || (!allUsers && selected.length === 0)}><Send size={16} />{sending ? "Sending…" : "Send notification"}</Button></div>
      </section>
      <aside className="admin-notification-aside">
        <section className="admin-notification-preview-card"><div className="admin-notification-section-heading"><span className="admin-notification-heading-icon preview"><Eye size={22} /></span><div><h2>Message preview</h2><p>This is how your notification will look in the app.</p></div></div><div className="admin-notification-preview"><span className="admin-notification-app-icon"><Bell size={23} /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><strong>BlueWords</strong><span>now</span></div><h3>{title || "Notification title"}</h3><p>{message || "Your message will appear here…"}</p></div></div></section>
        <section className="admin-notification-selected-card"><div className="admin-notification-section-heading"><span className="admin-notification-heading-icon selected"><Users size={22} /></span><div><h2>Selected recipients</h2><p>{allUsers ? `${recipients.length} users will receive this` : `${selected.length} selected`}</p></div></div>{allUsers ? <div className="admin-selected-summary"><span className="admin-selected-avatar-stack">{recipients.slice(0, 4).map((recipient) => <span key={recipient.id}>{recipientInitials(recipient)}</span>)}</span><strong>All users</strong></div> : selectedRecipients.length ? <ul className="admin-selected-list">{selectedRecipients.slice(0, 5).map((recipient) => <li key={recipient.id}><span className="admin-recipient-avatar">{recipientInitials(recipient)}</span><span className="min-w-0"><strong>{recipient.nickname || recipient.email || "User"}</strong><small>{recipient.email}</small></span></li>)}</ul> : <div className="admin-selected-empty"><span className="admin-selected-empty-icon"><Users size={28} /></span><strong>No recipients selected</strong><p>Choose one or more users from the list or select all users.</p></div>}</section>
        <div className="admin-notification-info"><Info size={21} /><p>Notifications appear in each recipient&apos;s in-app Notifications page.</p></div>
      </aside>
    </form>
  </div>;
}
