import { NextResponse } from "next/server";
import type { AuthUser } from "@supabase/supabase-js";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { getErrorMessage } from "@/lib/errors";
import { getPageItems } from "@/lib/pagination";

function getAdminUserNickname(user: AuthUser, profileNickname?: string | null) {
  return profileNickname ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : "");
}

function mapAdminUser(user: AuthUser, profileNicknames?: ReadonlyMap<string, string>) {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    nickname: getAdminUserNickname(user, profileNicknames?.get(user.id)),
  };
}

async function getProfileNicknames(adminClient: AdminClient, users: AuthUser[]) {
  if (users.length === 0) return new Map<string, string>();
  const { data, error } = await adminClient.from("user_profiles").select("user_id, nickname").in("user_id", users.map((user) => user.id));
  if (error) {
    console.error("Could not load profiles for admin user list:", error.message);
    return new Map<string, string>();
  }
  const nicknames = new Map<string, string>();
  for (const profile of data ?? []) {
    if (profile.nickname) nicknames.set(profile.user_id, profile.nickname);
  }
  return nicknames;
}

export async function getAdminUsersByIds(adminClient: AdminClient, ids: string[]) {
  const requestedIds = new Set(ids);
  const matchedUsers = new Map<string, AuthUser>();
  for (let page = 1; matchedUsers.size < requestedIds.size; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 100 });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    for (const user of data.users) {
      if (requestedIds.has(user.id)) matchedUsers.set(user.id, user);
    }
    if (data.users.length < 100) break;
  }

  const users = [...matchedUsers.values()];
  try {
    const nicknames = await getProfileNicknames(adminClient, users);
    return NextResponse.json({
      users: users.map((user) => mapAdminUser(user, nicknames)),
    });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Could not load user profiles.") }, { status: 400 });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    let profileNicknames: Map<string, string>;
    try {
      profileNicknames = await getProfileNicknames(adminClient, data.users);
    } catch (profileError) {
      return NextResponse.json({ error: getErrorMessage(profileError, "Could not load user profiles.") }, { status: 400 });
    }
    for (const user of data.users) {
      const mappedUser = mapAdminUser(user, profileNicknames);
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
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    const nicknames = await getProfileNicknames(adminClient, data.users);
    return NextResponse.json({
      users: data.users.map((user) => mapAdminUser(user, nicknames)),
      total: data.total,
      page,
      pageSize,
    });
  } catch (profileError) {
    return NextResponse.json({ error: getErrorMessage(profileError, "Could not load user profiles.") }, { status: 400 });
  }
}
