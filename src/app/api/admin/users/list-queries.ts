import { NextResponse } from "next/server";
import type { AuthUser } from "@supabase/supabase-js";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { getErrorMessage } from "@/lib/errors";
import { getPageItems } from "@/lib/pagination";
import { getAdminUserNicknames, mapAdminUserRecord } from "@/lib/admin-user-mapping";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export async function getAdminUsersByIds(adminClient: AdminClient, ids: string[]) {
  const requestedIds = new Set(ids);
  const matchedUsers = new Map<string, AuthUser>();
  for (let page = 1; matchedUsers.size < requestedIds.size; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return jsonErrorResponse(error.message, 400);
    for (const user of data.users) {
      if (requestedIds.has(user.id)) matchedUsers.set(user.id, user);
    }
    if (data.users.length < 100) break;
  }

  const users = [...matchedUsers.values()];
  try {
    const nicknames = await getAdminUserNicknames(adminClient, users);
    return NextResponse.json({
      users: users.map((user) => mapAdminUserRecord(user, nicknames)),
    });
  } catch (error) {
    return jsonErrorResponse(getErrorMessage(error, "Could not load user profiles."), 400);
  }
}

export async function searchAdminUsers(
  adminClient: AdminClient,
  search: string,
  page: number,
  pageSize: number,
  all: boolean,
) {
  const matches = [];
  for (let userPage = 1; ; userPage += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page: userPage, perPage: 1000 });
    if (error) return jsonErrorResponse(error.message, 400);
    let profileNicknames: Map<string, string>;
    try {
      profileNicknames = await getAdminUserNicknames(adminClient, data.users);
    } catch (profileError) {
      return jsonErrorResponse(getErrorMessage(profileError, "Could not load user profiles."), 400);
    }
    for (const user of data.users) {
      const mappedUser = mapAdminUserRecord(user, profileNicknames);
      if (!search || (mappedUser.email ?? "").toLowerCase().includes(search) || mappedUser.nickname.toLowerCase().includes(search)) {
        matches.push(mappedUser);
      }
    }
    if (userPage >= data.lastPage || data.users.length === 0) break;
  }
  if (all) return NextResponse.json({ users: matches, total: matches.length });
  return NextResponse.json({ users: getPageItems(matches, page, pageSize), total: matches.length, page, pageSize });
}

export async function getAdminUsersPage(adminClient: AdminClient, page: number, pageSize: number) {
  const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
  if (error) return jsonErrorResponse(error.message, 400);
  try {
    const nicknames = await getAdminUserNicknames(adminClient, data.users);
    return NextResponse.json({
      users: data.users.map((user) => mapAdminUserRecord(user, nicknames)),
      total: data.total,
      page,
      pageSize,
    });
  } catch (profileError) {
    return jsonErrorResponse(getErrorMessage(profileError, "Could not load user profiles."), 400);
  }
}
