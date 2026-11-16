"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { loadUnreadNotificationCount } from "@/lib/notifications-data";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";

export function useSidebarNotificationCount(authUserId: string | null, isAuthenticated: boolean) {
  const supabase = useSupabaseClient();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !authUserId) return;
    const userId: string = authUserId;
    let active = true;
    async function refreshUnreadCount() {
      const { count, error } = await loadUnreadNotificationCount(supabase, userId);
      if (active && !error) setUnreadNotificationCount(count ?? 0);
    }

    const timer = window.setInterval(() => { void refreshUnreadCount(); }, 30_000);
    const handleNotificationsUpdated = () => { void refreshUnreadCount(); };
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    void refreshUnreadCount();
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleNotificationsUpdated);
    };
  }, [authUserId, isAuthenticated, supabase]);

  return unreadNotificationCount;
}
