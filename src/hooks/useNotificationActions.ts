import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@/lib/notifications";
import { markNotificationRead as updateNotificationRead, markRecentNotificationsRead } from "@/lib/notifications-data";
import { invalidateNotificationsCache } from "@/lib/notifications-cache.mjs";


export function useNotificationActions({
  supabase,
  setNotifications,
  setError,
  refresh,
}: {
  supabase: SupabaseClient;
  setNotifications: Dispatch<SetStateAction<NotificationRow[]>>;
  setError: Dispatch<SetStateAction<string>>;
  refresh: (force?: boolean) => Promise<void>;
}) {
  const router = useRouter();

  async function markAllRead() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;
    const now = new Date();
    const { error: updateError } = await markRecentNotificationsRead(supabase, user.id, now);
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
    const { error: updateError } = await updateNotificationRead(supabase, user.id, item.id, readAt);
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

  return { markAllRead, markAsRead, reviewRequest };
}
