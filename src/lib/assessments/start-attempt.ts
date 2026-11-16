import { hideQuestionAnswers } from "@/lib/assessments/server";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { shuffle } from "@/lib/random";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { firstRelation } from "@/lib/supabase/first-relation";
import { ASSESSMENT_QUESTION_COUNT } from "@/lib/assessments/constants";

export async function startAssignedAssessment(admin: AdminClient, userId: string, recipientId: string) {
  const { data: recipient, error } = await admin.from("assessment_recipients")
    .select("id,status,assessments!inner(id,title,difficulty,due_at,questions)")
    .eq("id", recipientId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !recipient) return { status: "not_found" as const };
  if (recipient.status === "completed") return { status: "completed" as const };

  const assessment = firstRelation(recipient.assessments)!;
  const { data: oldAttempts } = await admin.from("assessment_attempts")
    .select("id,attempt_number,started_at,completed_at,questions")
    .eq("recipient_id", recipientId)
    .order("attempt_number", { ascending: false })
    .limit(1);
  const latest = oldAttempts?.[0];
  if (latest && !latest.completed_at) {
    const existingQuestions = latest.questions as AssessmentQuestion[];
    return {
      status: "in_progress" as const,
      attempt: {
        id: latest.id,
        attempt_number: latest.attempt_number,
        started_at: latest.started_at,
        title: assessment.title,
        difficulty: assessment.difficulty,
        questions: existingQuestions.map(hideQuestionAnswers),
      },
    };
  }

  const attemptNumber = (latest?.attempt_number ?? 0) + 1;
  const questions = assessment?.questions as AssessmentQuestion[] | undefined;
  if (!questions || questions.length !== ASSESSMENT_QUESTION_COUNT) return { status: "unavailable" as const };
  const randomizedQuestions = shuffle(questions.map((question) => question.type === "vocabulary"
    ? { ...question, choices: shuffle(question.choices) }
    : { ...question, tiles: shuffle(question.tiles) }));
  const { data: attempt, error: insertError } = await admin.from("assessment_attempts")
    .insert({ recipient_id: recipientId, user_id: userId, attempt_number: attemptNumber, questions: randomizedQuestions, answers: [] })
    .select("id,attempt_number,started_at")
    .single();
  if (insertError || !attempt) return { status: "insert_error" as const, message: insertError?.message ?? "Could not start test." };

  await admin.from("assessment_recipients")
    .update({ status: "in_progress" })
    .eq("id", recipientId)
    .eq("user_id", userId);
  await admin.from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("entity_type", "assessment_assignment")
    .eq("entity_id", recipientId)
    .is("read_at", null);

  return {
    status: "started" as const,
    attempt: {
      ...attempt,
      title: assessment.title,
      difficulty: assessment.difficulty,
      questions: randomizedQuestions.map(hideQuestionAnswers),
    },
  };
}
