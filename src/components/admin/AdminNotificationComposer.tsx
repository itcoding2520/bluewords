"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Bell, Search, Send } from "lucide-react";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { Button } from "@/components/ui/Button";
import { getAdminCachedData } from "@/lib/admin-data-cache.mjs";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type Recipient = { id: string; email: string | null; nickname: string };

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

  return <div>
    <AdminNavigation active="notifications" />
    <header className="mb-6"><p className="text-sm font-medium text-blue-600">Administration</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Send notification</h1><p className="mt-2 text-sm text-slate-500">Send an in-app message to one or more users. Your own account is excluded.</p></header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4 whitespace-pre-line">{error}</AutoDismissMessage>}
    {notice && <AutoDismissMessage key={notice} variant="success" className="mb-4">{notice}</AutoDismissMessage>}
    <form onSubmit={(event) => void sendNotification(event)} className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <label className="block text-sm font-semibold text-slate-800">Recipients</label>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"><input type="radio" name="recipient-mode" checked={!allUsers} onChange={() => setAllUsers(false)} />Choose users</label>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5"><input type="radio" name="recipient-mode" checked={allUsers} onChange={() => setAllUsers(true)} />All users ({recipients.length})</label>
      </div>
      {!allUsers && <div className="mt-3 rounded-xl border border-slate-200">
        <label className="relative block border-b border-slate-100"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users…" aria-label="Search recipients" className="h-11 w-full rounded-t-xl pl-9 pr-3 text-sm outline-none" /></label>
        {loading ? <p className="p-4 text-sm text-slate-500">Loading users…</p> : <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">{filteredRecipients.map((recipient) => <label key={recipient.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50"><input type="checkbox" checked={selected.includes(recipient.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, recipient.id] : current.filter((id) => id !== recipient.id))} /><span className="min-w-0"><span className="block truncate font-medium text-slate-800">{recipient.nickname || recipient.email || "User"}</span><span className="block truncate text-xs text-slate-500">{recipient.email}</span></span></label>)}{filteredRecipients.length === 0 && <p className="p-4 text-sm text-slate-500">No matching users.</p>}</div>}
      </div>}
      <label className="mt-5 block text-sm font-semibold text-slate-800">Title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Notification title" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
      <label className="mt-4 block text-sm font-semibold text-slate-800">Message<textarea required maxLength={2000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your message…" className="mt-1.5 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /><span className="mt-1 block text-right text-xs font-normal text-slate-400">{message.length}/2000</span></label>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-slate-500">{allUsers ? `${recipients.length} recipient(s)` : `${selected.length} selected`}</p><Button type="submit" disabled={sending || loading || recipients.length === 0 || (!allUsers && selected.length === 0)}><Send size={16} />{sending ? "Sending…" : "Send notification"}</Button></div>
    </form>
    <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Bell size={14} /> Notifications appear in each recipient’s in-app Notifications page.</p>
  </div>;
}
