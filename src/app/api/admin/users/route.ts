import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { handleAdminUserMutation, type AdminUserMutationInput } from "@/app/api/admin/users/mutations";
import { getAdminUserList } from "@/app/api/admin/users/queries";

async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  if (!await isAdminUser(supabase, user.id)) return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  const adminClient = createAdminClient();
  if (!adminClient) return { response: NextResponse.json({ error: "User administration is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server." }, { status: 503 }) };
  return { user, adminClient };
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ("response" in auth) return auth.response;
  return getAdminUserList(auth.adminClient, request);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  return handleAdminUserMutation(
    auth.adminClient,
    auth.user.id,
    body as AdminUserMutationInput,
  );
}
