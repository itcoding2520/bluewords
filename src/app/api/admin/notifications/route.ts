import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { validateAdminNotificationInput } from "@/lib/admin-notification-input";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (!await isAdminUser(supabase, user.id)) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const adminClient = createAdminClient();
  if (!adminClient) return NextResponse.json({ error: "Notification sending is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const validation = validateAdminNotificationInput(body, user.id);
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
