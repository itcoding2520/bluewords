import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!serviceKey) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

  const adminClient = createAdminClient();
  if (!adminClient) return NextResponse.json({ error: "Notification sending is not configured." }, { status: 503 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = body as { title?: unknown; message?: unknown; recipientIds?: unknown };
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!title || title.length > 120) return NextResponse.json({ error: "Title is required and must be 120 characters or fewer." }, { status: 400 });
  if (!message || message.length > 2000) return NextResponse.json({ error: "Message is required and must be 2,000 characters or fewer." }, { status: 400 });
  if (!Array.isArray(input.recipientIds) || input.recipientIds.length === 0 || input.recipientIds.length > 500 || input.recipientIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ error: "Choose between 1 and 500 recipients." }, { status: 400 });
  }

  const recipientIds = [...new Set(input.recipientIds as string[])].filter((id) => id !== user.id);
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (recipientIds.length === 0 || recipientIds.some((id) => !uuidPattern.test(id))) {
    return NextResponse.json({ error: "Choose at least one valid recipient other than yourself." }, { status: 400 });
  }

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
