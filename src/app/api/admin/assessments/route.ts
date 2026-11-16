import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { createAssessmentAssignment } from "@/lib/assessments/create-assignment";
import { getAdminAssessmentOverview } from "@/lib/assessments/admin-overview";
import { validateAssessmentAssignmentInput } from "@/lib/assessments/assignment-input";
import { readRequestJson } from "@/lib/api/request-json";

export async function GET() {
  const auth = await authorizeAdminRoute({
    serviceUnavailableMessage: "Assessment service is not configured.",
    authenticationFailure: { message: "Admin access required.", status: 403 },
  });
  if ("response" in auth) return auth.response;
  const overview = await getAdminAssessmentOverview(auth.adminClient);
  if (overview.status === "error") return NextResponse.json({ error: overview.message }, { status: 400 });
  return NextResponse.json({ assignments: overview.assignments, attempts: overview.attempts, users: overview.users });
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
  const result = await createAssessmentAssignment(
    admin,
    user.id,
    validation.value.details,
    validation.value.selection,
  );
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
