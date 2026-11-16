import { hideQuestionAnswers } from "@/lib/assessments/server";
import type { AdminClient } from "@/lib/supabase/admin-client";
import { firstRelation } from "@/lib/supabase/first-relation";

export async function listAssessmentAssignments(admin: AdminClient, userId: string) {
  const { data, error } = await admin.from("assessment_recipients")
    .select("id,status,assigned_at,assessments!inner(id,title,difficulty,due_at,questions),assessment_attempts(id,attempt_number,score,correct_count,elapsed_seconds,result,started_at,completed_at)")
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false })
    .limit(200);
  if (error) return { status: "error" as const, message: error.message };

  const assignments = (data ?? []).map((item) => {
    const assessment = firstRelation(item.assessments);
    const attempts = [...(item.assessment_attempts ?? [])].sort((a, b) => b.attempt_number - a.attempt_number);
    return {
      id: item.id,
      status: item.status,
      assignedAt: item.assigned_at,
      assessment: assessment ? {
        id: assessment.id,
        title: assessment.title,
        difficulty: assessment.difficulty,
        dueAt: assessment.due_at,
        questions: (assessment.questions as Parameters<typeof hideQuestionAnswers>[0][]).map(hideQuestionAnswers),
      } : null,
      attempts,
    };
  });

  return { status: "success" as const, assignments };
}
