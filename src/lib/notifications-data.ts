import type { SupabaseClient } from "@/lib/supabase/client";
import { getCachedNotifications, peekCachedNotifications } from "@/lib/notifications-cache.mjs";
import {
  NOTIFICATION_LOOKBACK_MS,
  recentNotifications,
  type NotificationRow,
} from "@/lib/notifications";


export function peekRecentNotifications(userId: string): NotificationRow[] | null {
  const cachedRows = peekCachedNotifications(userId) as NotificationRow[] | null;
  return cachedRows ? recentNotifications(cachedRows) : null;
}

export function loadRecentNotifications(
  supabase: SupabaseClient,
  userId: string,
  force = false
): Promise<NotificationRow[]> {
  const now = new Date();
  const cutoff = new Date(now.getTime() - NOTIFICATION_LOOKBACK_MS).toISOString();

  return getCachedNotifications(userId, async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, kind, entity_type, entity_id, read_at, created_at")
      .neq("kind", "assessment_assigned")
      .gte("created_at", cutoff)
      .lte("created_at", now.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  }, { force });
}

export async function markRecentNotificationsRead(
  supabase: SupabaseClient,
  userId: string,
  readAt: Date,
) {
  const cutoff = new Date(readAt.getTime() - NOTIFICATION_LOOKBACK_MS).toISOString();
  const timestamp = readAt.toISOString();
  return supabase.from("notifications")
    .update({ read_at: timestamp })
    .eq("recipient_id", userId)
    .neq("kind", "assessment_assigned")
    .gte("created_at", cutoff)
    .lte("created_at", timestamp)
    .is("read_at", null);
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  userId: string,
  notificationId: string,
  readAt: string,
) {
  return supabase.from("notifications")
    .update({ read_at: readAt })
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .is("read_at", null);
}
