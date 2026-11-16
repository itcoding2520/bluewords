import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { recentNotifications, type NotificationRow } from "@/lib/notifications";
import { loadRecentNotifications, peekRecentNotifications } from "@/lib/notifications-data";
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
    const cachedRows = peekRecentNotifications(user.id);
    if (cachedRows) {
      setNotifications(cachedRows);
      setLoading(false);
    } else setLoading(true);
    try {
      const rows = await loadRecentNotifications(supabase, user.id, force);
      setError("");
      setNotifications(recentNotifications(rows));
      setLoading(false);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load notifications."));
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      void refresh().catch((cause) => { if (active) setError(getErrorMessage(cause, "Could not load notifications.")); });
    }, 0);
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        void refresh(true).catch((cause) => { if (active) setError(getErrorMessage(cause, "Could not load notifications.")); });
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

  return {
    data: { notifications, unreadCount },
    status: { loading, error },
    actions: { refresh, markAllRead, markAsRead, reviewRequest },
  };
}
