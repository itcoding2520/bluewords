import { NextResponse, type NextRequest } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { handleAdminUserMutation, type AdminUserMutationInput } from "@/app/api/admin/users/mutations";
import { getAdminUserList } from "@/app/api/admin/users/queries";

const USER_ADMIN_SERVICE_UNAVAILABLE_MESSAGE = "User administration is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.";

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminRoute(USER_ADMIN_SERVICE_UNAVAILABLE_MESSAGE);
  if ("response" in auth) return auth.response;
  return getAdminUserList(auth.adminClient, request);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRoute(USER_ADMIN_SERVICE_UNAVAILABLE_MESSAGE);
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
