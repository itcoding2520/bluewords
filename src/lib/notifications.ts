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

export const NOTIFICATION_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

export function recentNotifications(rows: NotificationRow[], now = Date.now()) {
  const cutoff = now - NOTIFICATION_LOOKBACK_MS;
  return rows.filter((item) => {
    if (item.kind === "assessment_assigned") return false;
    const createdAt = new Date(item.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt >= cutoff && createdAt <= now;
  });
}
