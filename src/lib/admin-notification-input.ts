import { isObjectRecord } from "@/lib/is-object-record";

type AdminNotificationInput = {
  title: string;
  message: string;
  recipientIds: string[];
};

type AdminNotificationInputResult =
  | { ok: true; value: AdminNotificationInput }
  | { ok: false; message: string };

export function validateAdminNotificationInput(
  input: unknown,
  senderId: string,
): AdminNotificationInputResult {
  if (!isObjectRecord(input)) {
    return { ok: false, message: "Invalid request." };
  }

  const body = input;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!title || title.length > 120) {
    return { ok: false, message: "Title is required and must be 120 characters or fewer." };
  }
  if (!message || message.length > 2000) {
    return { ok: false, message: "Message is required and must be 2,000 characters or fewer." };
  }
  if (
    !Array.isArray(body.recipientIds)
    || body.recipientIds.length === 0
    || body.recipientIds.length > 500
    || body.recipientIds.some((id) => typeof id !== "string")
  ) {
    return { ok: false, message: "Choose between 1 and 500 recipients." };
  }

  const recipientIds = [...new Set(body.recipientIds as string[])].filter((id) => id !== senderId);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (recipientIds.length === 0 || recipientIds.some((id) => !uuidPattern.test(id))) {
    return { ok: false, message: "Choose at least one valid recipient other than yourself." };
  }

  return { ok: true, value: { title, message, recipientIds } };
}
