import { NextRequest, NextResponse } from "next/server";
import {
  getAssessmentAdminClient,
  requireAssessmentAdminContext,
  requireAssessmentUser,
} from "@/lib/assessments/server";
import { getAssessmentAttemptResult } from "@/lib/assessments/get-attempt-result";
import { submitAssessmentAttempt } from "@/lib/assessments/submit-attempt";
import { readRequestJsonOrResponse } from "@/lib/api/request-json";
import { jsonErrorResponse } from "@/lib/api/json-error-response";
import { isObjectRecord } from "@/lib/is-object-record";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/assessments/constants";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAssessmentAdminContext("Sign in to view your results.");
  if ("response" in access) return access.response;
  const { user, admin } = access;
  const { id } = await context.params;
  const result = await getAssessmentAttemptResult(admin, id, user.id);
  if (result.status === "not_found") return jsonErrorResponse("Result not found.", 404);
  return NextResponse.json({ attempt: result.attempt });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to submit this test.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const parsedBody = await readRequestJsonOrResponse(request, "Invalid request.");
  if (!parsedBody.ok) return parsedBody.response;
  const body = parsedBody.value;
  if (!isObjectRecord(body) || !Array.isArray(body.answers)) return jsonErrorResponse("Provide an answer for each question.", 400);
  if (body.answers.length !== ASSESSMENT_QUESTION_COUNT || body.answers.some((answer) => typeof answer !== "string")) return jsonErrorResponse(`All ${ASSESSMENT_QUESTION_COUNT} answers are required.`, 400);
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const result = await submitAssessmentAttempt(admin, id, user.id, body.answers as string[]);
  if (result.status === "not_found") return jsonErrorResponse("Attempt not found.", 404);
  if (result.status === "already_submitted") return jsonErrorResponse("This attempt has already been submitted.", 409);
  if (result.status === "update_error") return jsonErrorResponse(result.message, 400);
  return NextResponse.json({
    score: result.score,
    correctCount: result.correctCount,
    incorrectCount: result.incorrectCount,
    elapsedSeconds: result.elapsedSeconds,
    result: result.result,
    answers: result.answers,
    questions: result.questions,
    completedAt: result.completedAt,
  });
}
