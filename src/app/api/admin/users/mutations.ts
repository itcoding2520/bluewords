import { NextResponse } from "next/server";
import type { AdminClient } from "@/lib/supabase/admin-client";

export interface AdminUserMutationInput {
  action?: unknown;
  userId?: unknown;
  email?: unknown;
  password?: unknown;
  nickname?: unknown;
}

async function createAdminUser(adminClient: AdminClient, input: AdminUserMutationInput) {
  if (typeof input.email !== "string" || !input.email.includes("@") || typeof input.password !== "string" || input.password.length < 8) {
    return NextResponse.json({ error: "Provide a valid email and password of at least 8 characters." }, { status: 400 });
  }
  const { data, error } = await adminClient.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: { nickname: typeof input.nickname === "string" ? input.nickname.trim().slice(0, 60) : "" },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 });
}

async function deleteAdminUser(adminClient: AdminClient, actorId: string, userId: string) {
  if (userId === actorId) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }

  // Remove owned words before deleting the auth user because their category
  // foreign key uses ON DELETE RESTRICT.
  const { error: vocabularyError } = await adminClient
    .from("vocabulary_words")
    .delete()
    .eq("user_id", userId);
  if (vocabularyError) {
    console.error("Could not remove vocabulary before deleting admin user:", vocabularyError.message);
    return NextResponse.json({ error: "Could not remove the user's vocabulary. The account was not deleted." }, { status: 500 });
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    console.error("Could not delete admin-managed user:", error.message);
    return NextResponse.json({ error: "Could not delete this account. Please refresh and try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

async function updateAdminUser(adminClient: AdminClient, userId: string, input: AdminUserMutationInput) {
  const attributes: { email?: string; password?: string; user_metadata?: Record<string, string> } = {};
  if (typeof input.email === "string" && input.email.trim()) attributes.email = input.email.trim();
  if (typeof input.password === "string" && input.password) {
    if (input.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    attributes.password = input.password;
  }
  const nickname = typeof input.nickname === "string" ? input.nickname.trim() : undefined;
  if (nickname !== undefined && nickname !== "" && (nickname.length < 2 || nickname.length > 24)) {
    return NextResponse.json({ error: "Nickname must be between 2 and 24 characters, or blank to clear it." }, { status: 400 });
  }
  if (nickname !== undefined) attributes.user_metadata = { nickname };
  if (!attributes.email && !attributes.password && !attributes.user_metadata) {
    return NextResponse.json({ error: "Provide an email, nickname, or password to update." }, { status: 400 });
  }
  if (nickname !== undefined) {
    const { error: profileError } = await adminClient.from("user_profiles")
      .upsert({ user_id: userId, nickname: nickname || null }, { onConflict: "user_id" });
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 400 });
  }
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, attributes);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } });
}

export async function handleAdminUserMutation(
  adminClient: AdminClient,
  actorId: string,
  input: AdminUserMutationInput,
) {
  if (input.action === "create") return createAdminUser(adminClient, input);

  if (typeof input.userId !== "string") {
    return NextResponse.json({ error: "A userId is required." }, { status: 400 });
  }
  if (input.action === "delete") return deleteAdminUser(adminClient, actorId, input.userId);
  if (input.action === "update") return updateAdminUser(adminClient, input.userId, input);

  return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
}
