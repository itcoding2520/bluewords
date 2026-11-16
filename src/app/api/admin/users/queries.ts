import { NextResponse, type NextRequest } from "next/server";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { isUuid } from "@/lib/is-uuid";
import { getAdminUsersByIds, getAdminUsersPage, searchAdminUsers } from "@/app/api/admin/users/list-queries";

export async function getAdminUserList(adminClient: AdminClient, request: NextRequest) {
  const idsParameter = request.nextUrl.searchParams.get("ids");
  if (idsParameter) {
    const ids = [...new Set(idsParameter.split(",").filter(Boolean))];
    if (ids.length > 100 || ids.some((id) => !isUuid(id))) {
      return NextResponse.json({ error: "Provide at most 100 valid user IDs." }, { status: 400 });
    }

    return getAdminUsersByIds(adminClient, ids);
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
  const requestedPageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10") || 10;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim().toLowerCase();
  const all = request.nextUrl.searchParams.get("all") === "true";

  if (search || all) {
    return searchAdminUsers(adminClient, search, page, pageSize, all);
  }

  return getAdminUsersPage(adminClient, page, pageSize);
}
