import { NextResponse } from "next/server";
import { requireAssessmentAdminContext } from "@/lib/assessments/server";
import { listAssessmentAssignments } from "@/lib/assessments/list-assignments";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export async function GET() {
  const context = await requireAssessmentAdminContext("Sign in to view your assignments.");
  if ("response" in context) return context.response;
  const { user, admin } = context;
  const result = await listAssessmentAssignments(admin, user.id);
  if (result.status === "error") return jsonErrorResponse(result.message, 400);
  return NextResponse.json({ assignments: result.assignments });
}
