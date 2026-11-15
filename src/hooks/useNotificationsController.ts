import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCachedNotifications, peekCachedNotifications } from "@/lib/notifications-cache.mjs";
import { NOTIFICATION_LOOKBACK_MS, recentNotifications, type NotificationRow } from "@/lib/notifications";
import { useNotificationActions } from "@/hooks/useNotificationActions";

export type { NotificationRow } from "@/lib/notifications";

export function useNotificationsController() {
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

  const { markAllRead, markAsRead, reviewRequest } = useNotificationActions({
    supabase,
    setNotifications,
    setError,
    refresh,
  });

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  return { notifications, loading, error, refresh, markAllRead, markAsRead, reviewRequest, unreadCount };
}
