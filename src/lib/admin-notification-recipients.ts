export type AdminNotificationRecipient = {
  id: string;
  email: string | null;
  nickname: string;
};

export function getAdminNotificationRecipientInitials(
  recipient: AdminNotificationRecipient,
): string {
  return (recipient.nickname || recipient.email || "U")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase() || "U";
}
