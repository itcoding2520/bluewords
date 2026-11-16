import { NextResponse, type NextRequest } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { validateAdminNotificationInput } from "@/lib/admin-notification-input";
import { readRequestJsonOrResponse } from "@/lib/api/request-json";

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRoute({ serviceUnavailableMessage: "Notification sending is not configured." });
  if ("response" in auth) return auth.response;
  const { user, adminClient } = auth;

  const parsedBody = await readRequestJsonOrResponse(request);
  if (!parsedBody.ok) return parsedBody.response;
  const validation = validateAdminNotificationInput(parsedBody.value, user.id);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });
  const { title, message, recipientIds } = validation.value;

  const rows = recipientIds.map((recipientId) => ({
    recipient_id: recipientId,
    actor_id: user.id,
    kind: "admin_message",
    title,
    body: message,
  }));
  const { error } = await adminClient.from("notifications").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ sent: rows.length });
}
