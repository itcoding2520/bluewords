import { NextRequest, NextResponse } from "next/server";
import { authorizeAdminRoute } from "@/lib/supabase/admin-route-context";
import { createAssessmentAssignment } from "@/lib/assessments/create-assignment";
import { getAdminAssessmentOverview } from "@/lib/assessments/admin-overview";
import { validateAssessmentAssignmentInput } from "@/lib/assessments/assignment-input";
import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { readRequestJsonOrResponse } from "@/lib/api/request-json";

const ADMIN_AUTH_OPTIONS = {
  serviceUnavailableMessage: "Assessment service is not configured.",
  authenticationFailure: { message: "Admin access required.", status: 403 },
} as const;

export async function GET() {
  const auth = await authorizeAdminRoute(ADMIN_AUTH_OPTIONS);
  if ("response" in auth) return auth.response;
  const overview = await getAdminAssessmentOverview(auth.adminClient);
  if (overview.status === "error") return jsonErrorResponse(overview.message, 400);
  return NextResponse.json({ assignments: overview.assignments, attempts: overview.attempts, users: overview.users });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRoute(ADMIN_AUTH_OPTIONS);
  if ("response" in auth) return auth.response;
  const { adminClient: admin, user } = auth;
  const parsedBody = await readRequestJsonOrResponse(request);
  if (!parsedBody.ok) return parsedBody.response;
  const validation = validateAssessmentAssignmentInput(parsedBody.value);
  if (!validation.ok) return jsonErrorResponse(validation.message, 400);
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
    return jsonErrorResponse(result.message, 400);
  }
  if (result.status === "questions_unavailable") {
    return jsonErrorResponse("This difficulty needs at least 5 public vocabulary words and 5 active sentence questions.", 422);
  }
  if (result.status === "no_recipients") {
    return jsonErrorResponse("Select at least one learner (your own account is excluded).", 400);
  }
  return NextResponse.json({ assignment: result.assignment, recipients: result.recipientCount });
}
