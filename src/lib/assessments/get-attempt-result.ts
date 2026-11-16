import type { AdminClient } from "@/lib/supabase/admin-client";
import { hideQuestionAnswers, signQuestionImages } from "@/lib/assessments/server";
import type { AssessmentQuestion } from "@/lib/assessments/types";

export async function getAssessmentAttemptResult(
  admin: AdminClient,
  attemptId: string,
  userId: string,
) {
  const { data, error } = await admin
    .from("assessment_attempts")
    .select("id,recipient_id,attempt_number,questions,answers,score,correct_count,elapsed_seconds,result,started_at,completed_at,assessment_recipients!inner(assessments!inner(title,difficulty))")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return { status: "not_found" as const };
  if (data.completed_at) return { status: "found" as const, attempt: data };

  const questions = data.questions as AssessmentQuestion[];
  const questionsWithImages = await signQuestionImages(admin, questions);
  return {
    status: "found" as const,
    attempt: { ...data, questions: questionsWithImages.map(hideQuestionAnswers) },
  };
}
