import { readResponseJson } from "@/lib/api/read-response-json";

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
  return readResponseJson<CreateAdminNotificationResponse>(response, "Could not send notification.");
}
