import { gradeAssessmentAttempt } from "@/lib/assessments/grading";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import type { AdminClient } from "@/lib/supabase/admin-client";

export type SubmitAssessmentAttemptResult =
  | { status: "not_found" }
  | { status: "already_submitted" }
  | { status: "update_error"; message: string }
  | {
      status: "submitted";
      score: number;
      correctCount: number;
      incorrectCount: number;
      elapsedSeconds: number;
      result: "passed" | "failed";
      answers: string[];
      questions: AssessmentQuestion[];
      completedAt: string;
    };

export async function submitAssessmentAttempt(
  admin: AdminClient,
  attemptId: string,
  userId: string,
  answers: string[],
): Promise<SubmitAssessmentAttemptResult> {
  const { data: attempt, error } = await admin.from("assessment_attempts")
    .select("id,user_id,recipient_id,questions,started_at,completed_at")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !attempt) return { status: "not_found" };
  if (attempt.completed_at) return { status: "already_submitted" };

  const questions = attempt.questions as AssessmentQuestion[];
  const { correctCount, score, result } = gradeAssessmentAttempt(questions, answers);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000));
  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin.from("assessment_attempts")
    .update({ answers, score, correct_count: correctCount, elapsed_seconds: elapsedSeconds, result, completed_at: completedAt })
    .eq("id", attemptId)
    .eq("user_id", userId)
    .is("completed_at", null);
  if (updateError) return { status: "update_error", message: updateError.message };

  const { data: recipient } = await admin.from("assessment_recipients")
    .select("id")
    .eq("id", attempt.recipient_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (recipient) {
    await admin.from("assessment_recipients")
      .update({ status: result === "passed" ? "completed" : "in_progress" })
      .eq("id", recipient.id);
  }

  return {
    status: "submitted",
    score,
    correctCount,
    incorrectCount: 10 - correctCount,
    elapsedSeconds,
    result,
    answers,
    questions,
    completedAt,
  };
}
