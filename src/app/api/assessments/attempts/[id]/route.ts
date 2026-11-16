import { NextRequest, NextResponse } from "next/server";
import { getAssessmentAdminClient, hideQuestionAnswers, requireAssessmentUser, signQuestionImages } from "@/lib/assessments/server";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { submitAssessmentAttempt } from "@/lib/assessments/submit-attempt";
import { readRequestJson } from "@/lib/api/request-json";
import { isObjectRecord } from "@/lib/is-object-record";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to view your results.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const { data, error } = await admin.from("assessment_attempts").select("id,recipient_id,attempt_number,questions,answers,score,correct_count,elapsed_seconds,result,started_at,completed_at,assessment_recipients!inner(assessments!inner(title,difficulty))").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Result not found." }, { status: 404 });
  if (!data.completed_at) {
    const questions = data.questions as AssessmentQuestion[];
    const questionsWithImages = await signQuestionImages(admin, questions);
    return NextResponse.json({ attempt: { ...data, questions: questionsWithImages.map(hideQuestionAnswers) } });
  }
  return NextResponse.json({ attempt: data });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to submit this test.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const parsedBody = await readRequestJson(request);
  if (!parsedBody.ok) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const body = parsedBody.value;
  if (!isObjectRecord(body) || !Array.isArray(body.answers)) return NextResponse.json({ error: "Provide an answer for each question." }, { status: 400 });
  if (body.answers.length !== 10 || body.answers.some((answer) => typeof answer !== "string")) return NextResponse.json({ error: "All 10 answers are required." }, { status: 400 });
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const result = await submitAssessmentAttempt(admin, id, user.id, body.answers as string[]);
  if (result.status === "not_found") return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  if (result.status === "already_submitted") return NextResponse.json({ error: "This attempt has already been submitted." }, { status: 409 });
  if (result.status === "update_error") return NextResponse.json({ error: result.message }, { status: 400 });
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
