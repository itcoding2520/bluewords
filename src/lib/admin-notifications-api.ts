import { postJson } from "@/lib/api/post-json";

type CreateAdminNotificationResponse = {
  sent?: number;
  error?: string;
};

export async function createAdminNotification(input: {
  title: string;
  message: string;
  recipientIds: string[];
}): Promise<CreateAdminNotificationResponse> {
  return postJson<CreateAdminNotificationResponse>(
    "/api/admin/notifications",
    input,
    "Could not send notification.",
  );
}
