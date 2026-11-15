import { NextResponse, type NextRequest } from "next/server";
import type { AuthUser } from "@supabase/supabase-js";
import type { AdminClient } from "@/lib/supabase/admin-client";

function mapAdminUser(user: AuthUser, profileNickname?: string | null) {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    nickname: profileNickname ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : ""),
  };
}

async function getProfileNicknames(adminClient: AdminClient, users: AuthUser[]) {
  if (users.length === 0) return new Map<string, string>();
  const { data, error } = await adminClient.from("user_profiles").select("user_id, nickname").in("user_id", users.map((user) => user.id));
  if (error) {
    console.error("Could not load profiles for admin user list:", error.message);
    return new Map<string, string>();
  }
  return new Map((data ?? []).flatMap((profile) => profile.nickname ? [[profile.user_id, profile.nickname] as const] : []));
}

export async function getAdminUserList(adminClient: AdminClient, request: NextRequest) {
  const idsParameter = request.nextUrl.searchParams.get("ids");
  if (idsParameter) {
    const ids = [...new Set(idsParameter.split(",").filter(Boolean))];
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (ids.length > 100 || ids.some((id) => !uuidPattern.test(id))) {
      return NextResponse.json({ error: "Provide at most 100 valid user IDs." }, { status: 400 });
    }

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
      return NextResponse.json({ users: users.map((user) => mapAdminUser(user, nicknames.get(user.id))) });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load user profiles." }, { status: 400 });
    }
  }

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1") || 1);
  const requestedPageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? "10") || 10;
  const pageSize = Math.min(100, Math.max(1, requestedPageSize));
  const search = (request.nextUrl.searchParams.get("search") ?? "").trim().toLowerCase();
  const all = request.nextUrl.searchParams.get("all") === "true";

  if (search || all) {
    const matches = [];
    for (let userPage = 1; ; userPage += 1) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page: userPage, perPage: 1000 });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      let profileNicknames: Map<string, string>;
      try {
        profileNicknames = await getProfileNicknames(adminClient, data.users);
      } catch (profileError) {
        return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Could not load user profiles." }, { status: 400 });
      }
      for (const user of data.users) {
        const nickname = profileNicknames.get(user.id) ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : "");
        if (!search || (user.email ?? "").toLowerCase().includes(search) || nickname.toLowerCase().includes(search)) {
          matches.push(mapAdminUser(user, profileNicknames.get(user.id)));
        }
      }
      if (userPage >= data.lastPage || data.users.length === 0) break;
    }
    if (all) return NextResponse.json({ users: matches, total: matches.length });
    const offset = (page - 1) * pageSize;
    return NextResponse.json({ users: matches.slice(offset, offset + pageSize), total: matches.length, page, pageSize });
  }

  const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: pageSize });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    const nicknames = await getProfileNicknames(adminClient, data.users);
    return NextResponse.json({ users: data.users.map((user) => mapAdminUser(user, nicknames.get(user.id))), total: data.total, page, pageSize });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Could not load user profiles." }, { status: 400 });
  }
}
