import { NextRequest, NextResponse } from "next/server";
import { createAssessmentAdminClient, getRequestUser, signQuestionImages, type AssessmentQuestion } from "@/lib/assessments/server";

const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+([.,!?])/g, "$1").replace(/\s+/g, " ");

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Sign in to view your results." }, { status: 401 });
  const { id } = await context.params;
  const admin = createAssessmentAdminClient();
  if (!admin) return NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
  const { data, error } = await admin.from("assessment_attempts").select("id,recipient_id,attempt_number,questions,answers,score,correct_count,elapsed_seconds,result,started_at,completed_at,assessment_recipients!inner(assessments!inner(title,difficulty))").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !data) return NextResponse.json({ error: "Result not found." }, { status: 404 });
  if (!data.completed_at) {
    const questions = data.questions as AssessmentQuestion[];
    const questionsWithImages = await signQuestionImages(admin, questions);
    return NextResponse.json({ attempt: { ...data, questions: questionsWithImages.map((question) => ({ ...question, answer: undefined })) } });
  }
  return NextResponse.json({ attempt: data });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { user } = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Sign in to submit this test." }, { status: 401 });
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (!body || typeof body !== "object" || !Array.isArray((body as { answers?: unknown }).answers)) return NextResponse.json({ error: "Provide an answer for each question." }, { status: 400 });
  const answers = (body as { answers: unknown[] }).answers;
  if (answers.length !== 10 || answers.some((answer) => typeof answer !== "string")) return NextResponse.json({ error: "All 10 answers are required." }, { status: 400 });
  const admin = createAssessmentAdminClient();
  if (!admin) return NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
  const { data: attempt, error } = await admin.from("assessment_attempts").select("id,user_id,recipient_id,questions,started_at,completed_at").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  if (attempt.completed_at) return NextResponse.json({ error: "This attempt has already been submitted." }, { status: 409 });
  const questions = attempt.questions as AssessmentQuestion[];
  const correctCount = questions.reduce((total, question, index) => total + (normalize(String(answers[index])) === normalize(question.answer) ? 1 : 0), 0);
  const score = correctCount * 10;
  const result = score > 50 ? "passed" : "failed";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000));
  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin.from("assessment_attempts").update({ answers, score, correct_count: correctCount, elapsed_seconds: elapsedSeconds, result, completed_at: completedAt }).eq("id", id).eq("user_id", user.id).is("completed_at", null);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  const { data: recipient } = await admin.from("assessment_recipients").select("id").eq("id", attempt.recipient_id).eq("user_id", user.id).maybeSingle();
  if (recipient) await admin.from("assessment_recipients").update({ status: result === "passed" ? "completed" : "in_progress" }).eq("id", recipient.id);
  return NextResponse.json({ score, correctCount, incorrectCount: 10 - correctCount, elapsedSeconds, result, answers, questions, completedAt });
}
