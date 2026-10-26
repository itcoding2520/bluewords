import { NextResponse, type NextRequest } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { AuthUser } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAdminClient() {
  if (!serviceKey) return null;
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function mapAdminUser(user: AuthUser, profileNickname?: string | null) {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    nickname: profileNickname ?? (typeof user.user_metadata.nickname === "string" ? user.user_metadata.nickname : ""),
  };
}

async function getProfileNicknames(adminClient: NonNullable<ReturnType<typeof createAdminClient>>, users: AuthUser[]) {
  if (users.length === 0) return new Map<string, string>();
  const { data, error } = await adminClient.from("user_profiles").select("user_id, nickname").in("user_id", users.map((user) => user.id));
  if (error) {
    console.error("Could not load profiles for admin user list:", error.message);
    return new Map<string, string>();
  }
  return new Map((data ?? []).flatMap((profile) => profile.nickname ? [[profile.user_id, profile.nickname] as const] : []));
}

async function authorizeAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return { response: NextResponse.json({ error: "Admin access required." }, { status: 403 }) };
  const adminClient = createAdminClient();
  if (!adminClient) return { response: NextResponse.json({ error: "User administration is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server." }, { status: 503 }) };
  return { user, adminClient };
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ("response" in auth) return auth.response;
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
      const { data, error } = await auth.adminClient.auth.admin.listUsers({ page, perPage: 100 });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      for (const user of data.users) {
        if (requestedIds.has(user.id)) {
          matchedUsers.set(user.id, user);
        }
      }
      if (data.users.length < 100) break;
    }

    const users = [...matchedUsers.values()];
    try {
      const nicknames = await getProfileNicknames(auth.adminClient, users);
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
      const { data, error } = await auth.adminClient.auth.admin.listUsers({ page: userPage, perPage: 1000 });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      let profileNicknames: Map<string, string>;
      try {
        profileNicknames = await getProfileNicknames(auth.adminClient, data.users);
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

  const { data, error } = await auth.adminClient.auth.admin.listUsers({ page, perPage: pageSize });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    const nicknames = await getProfileNicknames(auth.adminClient, data.users);
    return NextResponse.json({ users: data.users.map((user) => mapAdminUser(user, nicknames.get(user.id))), total: data.total, page, pageSize });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Could not load user profiles." }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin();
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const input = body as { action?: unknown; userId?: unknown; email?: unknown; password?: unknown; nickname?: unknown };

  if (input.action === "create") {
    if (typeof input.email !== "string" || !input.email.includes("@") || typeof input.password !== "string" || input.password.length < 8) return NextResponse.json({ error: "Provide a valid email and password of at least 8 characters." }, { status: 400 });
    const { data, error } = await auth.adminClient.auth.admin.createUser({ email: input.email.trim(), password: input.password, email_confirm: true, user_metadata: { nickname: typeof input.nickname === "string" ? input.nickname.trim().slice(0, 60) : "" } });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 });
  }

  if (typeof input.userId !== "string") return NextResponse.json({ error: "A userId is required." }, { status: 400 });
  if (input.action === "delete") {
    if (input.userId === auth.user.id) return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
    const { error } = await auth.adminClient.auth.admin.deleteUser(input.userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (input.action === "update") {
    const attributes: { email?: string; password?: string; user_metadata?: Record<string, string> } = {};
    if (typeof input.email === "string" && input.email.trim()) attributes.email = input.email.trim();
    if (typeof input.password === "string" && input.password) {
      if (input.password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
      attributes.password = input.password;
    }
    const nickname = typeof input.nickname === "string" ? input.nickname.trim() : undefined;
    if (nickname !== undefined && nickname !== "" && (nickname.length < 2 || nickname.length > 24)) {
      return NextResponse.json({ error: "Nickname must be between 2 and 24 characters, or blank to clear it." }, { status: 400 });
    }
    if (nickname !== undefined) attributes.user_metadata = { nickname };
    if (!attributes.email && !attributes.password && !attributes.user_metadata) return NextResponse.json({ error: "Provide an email, nickname, or password to update." }, { status: 400 });
    if (nickname !== undefined) {
      const { error: profileError } = await auth.adminClient.from("user_profiles").upsert({ user_id: input.userId, nickname: nickname || null }, { onConflict: "user_id" });
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
    }
    const { data, error } = await auth.adminClient.auth.admin.updateUserById(input.userId, attributes);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
  }
  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
