import { useCallback, useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCachedNotifications, invalidateNotificationsCache, peekCachedNotifications } from "@/lib/notifications-cache.mjs";

export type NotificationRow = {
  id: string;
  title: string;
  body: string;
  kind: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

const NOTIFICATION_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

function recentNotifications(rows: NotificationRow[], now = Date.now()) {
  const cutoff = now - NOTIFICATION_LOOKBACK_MS;
  return rows.filter((item) => {
    if (item.kind === "assessment_assigned") return false;
    const createdAt = new Date(item.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt >= cutoff && createdAt <= now;
  });
}

export function useNotificationsController() {
  const router = useRouter();
  const supabase = useSupabaseClient();
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
        const { data, error: queryError } = await supabase.from("notifications").select("id, title, body, kind, entity_type, entity_id, read_at, created_at").neq("kind", "assessment_assigned").gte("created_at", cutoff).lte("created_at", now.toISOString()).order("created_at", { ascending: false }).limit(100);
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
    const { error: updateError } = await supabase.from("notifications").update({ read_at: now.toISOString() }).eq("recipient_id", user.id).neq("kind", "assessment_assigned").gte("created_at", cutoff).lte("created_at", now.toISOString()).is("read_at", null);
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

  return { notifications, loading, error, refresh, markAllRead, markAsRead, reviewRequest, unreadCount };
}
