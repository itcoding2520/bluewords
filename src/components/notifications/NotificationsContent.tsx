"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, BookOpen, CheckCheck, Clock3, FolderOpen, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCachedNotifications, invalidateNotificationsCache, peekCachedNotifications } from "@/lib/notifications-cache.mjs";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type NotificationRow = { id: string; title: string; body: string; kind: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string };
const NOTIFICATION_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function recentNotifications(rows: NotificationRow[], now = Date.now()) {
  const cutoff = now - NOTIFICATION_LOOKBACK_MS;
  return rows.filter((item) => {
    const createdAt = new Date(item.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt >= cutoff && createdAt <= now;
  });
}

export function NotificationsContent() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (force = false) => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    const cachedRows = peekCachedNotifications(user.id) as NotificationRow[] | null;
    if (cachedRows) {
      setNotifications(recentNotifications(cachedRows));
      setLoading(false);
    } else setLoading(true);
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - NOTIFICATION_LOOKBACK_MS).toISOString();
      const rows = await getCachedNotifications(user.id, async () => {
        const { data, error: queryError } = await supabase.from("notifications").select("id, title, body, kind, entity_type, entity_id, read_at, created_at").gte("created_at", cutoff).lte("created_at", now.toISOString()).order("created_at", { ascending: false }).limit(100);
        if (queryError) throw queryError;
        return (data ?? []) as NotificationRow[];
      }, { force });
      setError("");
      setNotifications(recentNotifications(rows));
      setLoading(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load notifications.");
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void refresh().catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load notifications."); });
    }, 0);
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void refresh(true).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load notifications."); });
      }
    };
    document.addEventListener("visibilitychange", handleFocus);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [refresh]);

  async function markAllRead() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const now = new Date();
    const cutoff = new Date(now.getTime() - NOTIFICATION_LOOKBACK_MS).toISOString();
    const { error: updateError } = await supabase.from("notifications").update({ read_at: now.toISOString() }).eq("recipient_id", user.id).gte("created_at", cutoff).lte("created_at", now.toISOString()).is("read_at", null);
    if (updateError) setError(updateError.message);
    else {
      invalidateNotificationsCache(user.id);
      window.dispatchEvent(new Event("bluewords:notifications-updated"));
      await refresh(true);
    }
  }

  async function markAsRead(item: NotificationRow) {
    if (item.read_at) return;
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("id", item.id)
      .eq("recipient_id", user.id)
      .is("read_at", null);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    invalidateNotificationsCache(user.id);
    setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: readAt } : notification));
    window.dispatchEvent(new Event("bluewords:notifications-updated"));
  }

  async function reviewRequest(event: MouseEvent<HTMLAnchorElement>, item: NotificationRow) {
    event.preventDefault();
    await markAsRead(item);
    router.push("/admin");
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return <div className="notifications-page">
    <header className="notifications-hero mb-6">
      <div className="notifications-heading"><p className="text-sm font-bold text-blue-600">Updates</p><h1 className="page-title mt-1">Notifications</h1><p className="page-intro-description mt-2">Stay updated on word and category requests</p></div>
      <div className="notifications-actions"><Button variant="secondary" onClick={() => void refresh(true)}><RefreshCw size={17} /> Refresh</Button><Button onClick={() => void markAllRead()} disabled={unreadCount === 0}><CheckCheck size={17} /> Mark all read {unreadCount > 0 && <span className="notification-unread-count">{unreadCount}</span>}</Button></div>
    </header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    {loading && notifications.length === 0 ? <div aria-label="Loading notifications" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div> : <div className="notifications-list space-y-3">
      {notifications.map((item, index) => (
        <article key={item.id} className={`notification-card notification-card-${index % 4} ${item.read_at ? "is-read" : "is-unread"}`}>
          {item.read_at ? (
            <div className="notification-main">
              <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
              <NotificationDetails item={item} />
            </div>
          ) : (
            <button type="button" onClick={() => void markAsRead(item)} className="notification-main notification-main-button">
              <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
              <NotificationDetails item={item} />
              <span className="notification-unread-dot" aria-label="Unread" />
            </button>
          )}
          {item.kind === "publish_request" && <Link href="/admin" onClick={(event) => void reviewRequest(event, item)} className="notification-review-link">Review <ArrowRight size={18} /></Link>}
        </article>
      ))}
      {notifications.length === 0 && <p className="notifications-empty rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500"><Bell className="mx-auto mb-3 size-8 text-blue-400" />You’re all caught up.</p>}
    </div>}
  </div>;
}

function NotificationDetails({ item }: { item: NotificationRow }) {
  return <span className="min-w-0 flex-1">
    <span className="block font-semibold text-slate-900">{item.title}</span>
    <span className="mt-1 block text-sm text-slate-600">{item.body}</span>
    <time className="notification-time mt-2 block text-xs text-slate-400" dateTime={item.created_at}><Clock3 size={15} />{new Date(item.created_at).toLocaleString()}</time>
  </span>;
}
