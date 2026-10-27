import { NextResponse } from "next/server";
import { createAssessmentAdminClient, getRequestUser, hideQuestionAnswers, shuffled, type AssessmentQuestion } from "@/lib/assessments/server";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { user } = await getRequestUser();
  if (!user) return NextResponse.json({ error: "Sign in to start this test." }, { status: 401 });
  const { id } = await context.params;
  const admin = createAssessmentAdminClient();
  if (!admin) return NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
  const { data: recipient, error } = await admin.from("assessment_recipients").select("id,status,assessments!inner(id,title,difficulty,due_at,questions)").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !recipient) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  if (recipient.status === "completed") return NextResponse.json({ error: "This assignment is already complete." }, { status: 409 });
  const assessment = Array.isArray(recipient.assessments) ? recipient.assessments[0] : recipient.assessments;
  const { data: oldAttempts } = await admin.from("assessment_attempts").select("id,attempt_number,started_at,completed_at,questions").eq("recipient_id", id).order("attempt_number", { ascending: false }).limit(1);
  const latest = oldAttempts?.[0];
  if (latest && !latest.completed_at) {
    const existingQuestions = latest.questions as AssessmentQuestion[];
    return NextResponse.json({ attempt: { id: latest.id, attempt_number: latest.attempt_number, started_at: latest.started_at, title: assessment.title, difficulty: assessment.difficulty, questions: existingQuestions.map(hideQuestionAnswers) } });
  }
  const attemptNumber = (latest?.attempt_number ?? 0) + 1;
  const questions = assessment?.questions as AssessmentQuestion[] | undefined;
  if (!questions || questions.length !== 10) return NextResponse.json({ error: "This test is not available." }, { status: 409 });
  const randomizedQuestions = shuffled(questions.map((question) => question.type === "vocabulary"
    ? { ...question, choices: shuffled(question.choices) }
    : { ...question, tiles: shuffled(question.tiles) }));
  const { data: attempt, error: insertError } = await admin.from("assessment_attempts").insert({ recipient_id: id, user_id: user.id, attempt_number: attemptNumber, questions: randomizedQuestions, answers: [] }).select("id,attempt_number,started_at").single();
  if (insertError || !attempt) return NextResponse.json({ error: insertError?.message ?? "Could not start test." }, { status: 400 });
  await admin.from("assessment_recipients").update({ status: "in_progress" }).eq("id", id).eq("user_id", user.id);
  await admin.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).eq("entity_type", "assessment_assignment").eq("entity_id", id).is("read_at", null);
  return NextResponse.json({ attempt: { ...attempt, title: assessment.title, difficulty: assessment.difficulty, questions: randomizedQuestions.map(hideQuestionAnswers) } });
}
