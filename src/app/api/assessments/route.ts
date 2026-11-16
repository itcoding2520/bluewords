import { NextResponse } from "next/server";
import { getAssessmentAdminClient, requireAssessmentUser } from "@/lib/assessments/server";
import { listAssessmentAssignments } from "@/lib/assessments/list-assignments";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export async function GET() {
  const auth = await requireAssessmentUser("Sign in to view your assignments.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const result = await listAssessmentAssignments(admin, user.id);
  if (result.status === "error") return jsonErrorResponse(result.message, 400);
  return NextResponse.json({ assignments: result.assignments });
}
