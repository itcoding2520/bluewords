import { NextResponse } from "next/server";
import { getAssessmentAdminClient, requireAssessmentUser } from "@/lib/assessments/server";
import { startAssignedAssessment } from "@/lib/assessments/start-attempt";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to start this test.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const result = await startAssignedAssessment(admin, user.id, id);
  if (result.status === "not_found") return jsonErrorResponse("Assignment not found.", 404);
  if (result.status === "completed") return jsonErrorResponse("This assignment is already complete.", 409);
  if (result.status === "unavailable") return jsonErrorResponse("This test is not available.", 409);
  if (result.status === "insert_error") return jsonErrorResponse(result.message, 400);
  return NextResponse.json({ attempt: result.attempt });
}
