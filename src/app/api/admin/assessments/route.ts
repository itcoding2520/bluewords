import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { createAssessmentAssignment } from "@/lib/assessments/create-assignment";
import { validateAssessmentAssignmentInput } from "@/lib/assessments/assignment-input";
import { readRequestJson } from "@/lib/api/request-json";

export async function GET() {
  const auth = await authorizeAdminRoute({
    serviceUnavailableMessage: "Assessment service is not configured.",
    authenticationFailure: { message: "Admin access required.", status: 403 },
  });
  if ("response" in auth) return auth.response;
  const { adminClient: admin } = auth;
  const [{ data: assignments, error }, { data: attempts, error: attemptsError }, { data: users, error: usersError }] = await Promise.all([
    admin.from("assessments").select("id,title,difficulty,due_at,created_at,assessment_recipients(id,user_id,status,assigned_at)").order("created_at", { ascending: false }).limit(100),
    admin.from("assessment_attempts").select("id,user_id,recipient_id,score,correct_count,elapsed_seconds,result,completed_at,attempt_number").not("completed_at", "is", null).order("completed_at", { ascending: false }).limit(100),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);
  if (error || attemptsError || usersError) return NextResponse.json({ error: error?.message ?? attemptsError?.message ?? usersError?.message }, { status: 400 });
  return NextResponse.json({ assignments: assignments ?? [], attempts: attempts ?? [], users: users?.users.map(({ id, email, user_metadata }) => ({ id, email, nickname: typeof user_metadata?.nickname === "string" ? user_metadata.nickname : "" })) ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRoute({
    serviceUnavailableMessage: "Assessment service is not configured.",
    authenticationFailure: { message: "Admin access required.", status: 403 },
  });
  if ("response" in auth) return auth.response;
  const { adminClient: admin, user } = auth;
  const parsedBody = await readRequestJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  const validation = validateAssessmentAssignmentInput(parsedBody.value);
  if (!validation.ok) return NextResponse.json({ error: validation.message }, { status: 400 });
  const selection = parsedBody.value as { allUsers?: unknown; recipientIds?: unknown };
  const result = await createAssessmentAssignment(admin, user.id, validation.value, {
    allUsers: selection.allUsers,
    recipientIds: selection.recipientIds,
  });
  if (result.status === "source_error"
    || result.status === "recipient_lookup_error"
    || result.status === "assignment_error"
    || result.status === "recipient_insert_error") {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }
  if (result.status === "questions_unavailable") {
    return NextResponse.json({ error: "This difficulty needs at least 5 public vocabulary words and 5 active sentence questions." }, { status: 422 });
  }
  if (result.status === "no_recipients") {
    return NextResponse.json({ error: "Select at least one learner (your own account is excluded)." }, { status: 400 });
  }
  return NextResponse.json({ assignment: result.assignment, recipients: result.recipientCount });
}
