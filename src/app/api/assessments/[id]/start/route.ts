import { NextResponse } from "next/server";
import { getAssessmentAdminClient, requireAssessmentUser } from "@/lib/assessments/server";
import { startAssignedAssessment } from "@/lib/assessments/start-attempt";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to start this test.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const result = await startAssignedAssessment(admin, user.id, id);
  if (result.status === "not_found") return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  if (result.status === "completed") return NextResponse.json({ error: "This assignment is already complete." }, { status: 409 });
  if (result.status === "unavailable") return NextResponse.json({ error: "This test is not available." }, { status: 409 });
  if (result.status === "insert_error") return NextResponse.json({ error: result.message }, { status: 400 });
  return NextResponse.json({ attempt: result.attempt });
}
