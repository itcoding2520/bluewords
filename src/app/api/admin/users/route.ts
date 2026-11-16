import { NextResponse, type NextRequest } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { handleAdminUserMutation } from "@/app/api/admin/users/mutations";
import { getAdminUserList } from "@/app/api/admin/users/queries";
import { readRequestJson } from "@/lib/api/request-json";
import { isObjectRecord } from "@/lib/is-object-record";

const USER_ADMIN_SERVICE_UNAVAILABLE_MESSAGE = "User administration is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.";
const USER_ADMIN_AUTH_OPTIONS = {
  serviceUnavailableMessage: USER_ADMIN_SERVICE_UNAVAILABLE_MESSAGE,
} as const;

export async function GET(request: NextRequest) {
  const auth = await authorizeAdminRoute(USER_ADMIN_AUTH_OPTIONS);
  if ("response" in auth) return auth.response;
  return getAdminUserList(auth.adminClient, request);
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRoute(USER_ADMIN_AUTH_OPTIONS);
  if ("response" in auth) return auth.response;
  const parsedBody = await readRequestJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const body = parsedBody.value;
  if (!isObjectRecord(body)) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  return handleAdminUserMutation(auth.adminClient, auth.user.id, body);
}
