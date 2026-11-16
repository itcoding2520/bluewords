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

  async function getCurrentUserId() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user.id ?? null;
  }

  function invalidateAndAnnounceUpdate(userId: string, updateLocalState?: () => void) {
    invalidateNotificationsCache(userId);
    updateLocalState?.();
    window.dispatchEvent(new Event("bluewords:notifications-updated"));
  }

  async function markAllRead() {
    const userId = await getCurrentUserId();
    if (!userId) return;
    const now = new Date();
    const { error: updateError } = await markRecentNotificationsRead(supabase, userId, now);
    if (updateError) setError(updateError.message);
    else {
      invalidateAndAnnounceUpdate(userId);
      await refresh(true);
    }
  }

  async function markAsRead(item: NotificationRow) {
    if (item.read_at) return;
    const userId = await getCurrentUserId();
    if (!userId) return;
    const readAt = new Date().toISOString();
    const { error: updateError } = await updateNotificationRead(supabase, userId, item.id, readAt);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    invalidateAndAnnounceUpdate(userId, () => {
      setNotifications((current) => current.map((notification) => notification.id === item.id ? { ...notification, read_at: readAt } : notification));
    });
  }

  async function reviewRequest(event: MouseEvent<HTMLAnchorElement>, item: NotificationRow) {
    event.preventDefault();
    await markAsRead(item);
    router.push("/admin");
  }

  return { markAllRead, markAsRead, reviewRequest };
}
