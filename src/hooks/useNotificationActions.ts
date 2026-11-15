import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { useRouter } from "next/navigation";
import type { createClient } from "@/lib/supabase/client";
import { NOTIFICATION_LOOKBACK_MS, type NotificationRow } from "@/lib/notifications";
import { invalidateNotificationsCache } from "@/lib/notifications-cache.mjs";

type SupabaseClient = ReturnType<typeof createClient>;

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

  return { markAllRead, markAsRead, reviewRequest };
}
