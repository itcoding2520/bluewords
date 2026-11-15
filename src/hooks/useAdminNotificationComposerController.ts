import { useEffect, useMemo, useState, type FormEvent } from "react";
import { getAdminCachedData } from "@/lib/admin-data-cache.mjs";
import { fetchAdminUsers } from "@/lib/admin-user-api";

export type AdminNotificationRecipient = { id: string; email: string | null; nickname: string };

export function useAdminNotificationComposerController(currentUserId: string) {
  const [recipients, setRecipients] = useState<AdminNotificationRecipient[]>([]);
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
        const payload = await getAdminCachedData(
          "admin:users:all-recipients",
          () => fetchAdminUsers(query)
        ) as { users?: AdminNotificationRecipient[] };
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

  function toggleRecipient(id: string, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((selectedId) => selectedId !== id));
  }

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

  return {
    recipients, selected, setSelected, allUsers, setAllUsers, search, setSearch, title, setTitle, message, setMessage,
    loading, sending, error, notice, filteredRecipients, selectedRecipients, toggleRecipient, sendNotification,
  };
}
