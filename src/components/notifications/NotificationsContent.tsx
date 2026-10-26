"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Bell, CheckCheck, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCachedNotifications, invalidateNotificationsCache, peekCachedNotifications } from "@/lib/notifications-cache.mjs";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type NotificationRow = { id: string; title: string; body: string; kind: string; entity_type: string | null; entity_id: string | null; read_at: string | null; created_at: string };

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
      setNotifications(cachedRows);
      setLoading(false);
    } else setLoading(true);
    try {
      const rows = await getCachedNotifications(user.id, async () => {
        const { data, error: queryError } = await supabase.from("notifications").select("id, title, body, kind, entity_type, entity_id, read_at, created_at").order("created_at", { ascending: false }).limit(100);
        if (queryError) throw queryError;
        return (data ?? []) as NotificationRow[];
      }, { force });
      setError("");
      setNotifications(rows);
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
    const { error: updateError } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
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

  return <div>
    <header className="mb-6 flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-blue-600">Updates</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Notifications</h1></div><div className="flex gap-2"><Button variant="secondary" onClick={() => void refresh(true)}><RefreshCw size={16} /> Refresh</Button><Button variant="secondary" onClick={() => void markAllRead()}><CheckCheck size={16} /> Mark all read</Button></div></header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    {loading && notifications.length === 0 ? <div aria-label="Loading notifications" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div> : <div className="space-y-3">
      {notifications.map((item) => (
        <article key={item.id} className={`rounded-2xl border p-4 ${item.read_at ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"}`}>
          {item.read_at ? (
            <div className="flex gap-3">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600"><Bell size={17} /></span>
              <NotificationDetails item={item} />
            </div>
          ) : (
            <button type="button" onClick={() => void markAsRead(item)} className="flex w-full cursor-pointer gap-3 text-left">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600"><Bell size={17} /></span>
              <NotificationDetails item={item} />
            </button>
          )}
          {item.kind === "publish_request" && <Link href="/admin" onClick={(event) => void reviewRequest(event, item)} className="ml-12 mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Review <ArrowRight size={15} /></Link>}
        </article>
      ))}
      {notifications.length === 0 && <p className="rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500">You’re all caught up.</p>}
    </div>}
  </div>;
}

function NotificationDetails({ item }: { item: NotificationRow }) {
  return <span className="min-w-0 flex-1">
    <span className="block font-semibold text-slate-900">{item.title}</span>
    <span className="mt-1 block text-sm text-slate-600">{item.body}</span>
    <time className="mt-2 block text-xs text-slate-400">{new Date(item.created_at).toLocaleString()}</time>
  </span>;
}
