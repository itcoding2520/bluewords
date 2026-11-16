import { NextResponse } from "next/server";
import { getAssessmentAdminClient, hideQuestionAnswers, requireAssessmentUser } from "@/lib/assessments/server";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { shuffle } from "@/lib/random";
import { firstRelation } from "@/lib/supabase/first-relation";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAssessmentUser("Sign in to start this test.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const { id } = await context.params;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const { data: recipient, error } = await admin.from("assessment_recipients").select("id,status,assessments!inner(id,title,difficulty,due_at,questions)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !recipient) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  if (recipient.status === "completed") return NextResponse.json({ error: "This assignment is already complete." }, { status: 409 });
  const assessment = firstRelation(recipient.assessments)!;
  const { data: oldAttempts } = await admin.from("assessment_attempts").select("id,attempt_number,started_at,completed_at,questions").eq("recipient_id", id).order("attempt_number", { ascending: false }).limit(1);
  const latest = oldAttempts?.[0];
  if (latest && !latest.completed_at) {
    const existingQuestions = latest.questions as AssessmentQuestion[];
    return NextResponse.json({ attempt: { id: latest.id, attempt_number: latest.attempt_number, started_at: latest.started_at, title: assessment.title, difficulty: assessment.difficulty, questions: existingQuestions.map(hideQuestionAnswers) } });
  }
  const attemptNumber = (latest?.attempt_number ?? 0) + 1;
  const questions = assessment?.questions as AssessmentQuestion[] | undefined;
  if (!questions || questions.length !== 10) return NextResponse.json({ error: "This test is not available." }, { status: 409 });
  const randomizedQuestions = shuffle(questions.map((question) => question.type === "vocabulary"
    ? { ...question, choices: shuffle(question.choices) }
    : { ...question, tiles: shuffle(question.tiles) }));
  const { data: attempt, error: insertError } = await admin.from("assessment_attempts").insert({ recipient_id: id, user_id: user.id, attempt_number: attemptNumber, questions: randomizedQuestions, answers: [] }).select("id,attempt_number,started_at").single();
  if (insertError || !attempt) return NextResponse.json({ error: insertError?.message ?? "Could not start test." }, { status: 400 });
  await admin.from("assessment_recipients").update({ status: "in_progress" }).eq("id", id).eq("user_id", user.id);
  await admin.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("entity_type", "assessment_assignment").eq("entity_id", id).is("read_at", null);
  return NextResponse.json({ attempt: { ...attempt, title: assessment.title, difficulty: assessment.difficulty, questions: randomizedQuestions.map(hideQuestionAnswers) } });
}
