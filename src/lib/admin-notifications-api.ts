type CreateAdminNotificationResponse = {
  sent?: number;
  error?: string;
};

export async function createAdminNotification(input: {
  title: string;
  message: string;
  recipientIds: string[];
}): Promise<CreateAdminNotificationResponse> {
  const response = await fetch("/api/admin/notifications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await response.json() as CreateAdminNotificationResponse;
  if (!response.ok) throw new Error(payload.error ?? "Could not send notification.");
  return payload;
}
