import { NextResponse } from "next/server";
import { getAssessmentAdminClient, hideQuestionAnswers, requireAssessmentUser } from "@/lib/assessments/server";
import { firstRelation } from "@/lib/supabase/first-relation";

export async function GET() {
  const auth = await requireAssessmentUser("Sign in to view your assignments.");
  if ("response" in auth) return auth.response;
  const { user } = auth;
  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return admin;
  const { data, error } = await admin.from("assessment_recipients").select("id,status,assigned_at,assessments!inner(id,title,difficulty,due_at,questions),assessment_attempts(id,attempt_number,score,correct_count,elapsed_seconds,result,started_at,completed_at)").eq("user_id", user.id).order("assigned_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const rows = (data ?? []).map((item) => {
    const assessment = firstRelation(item.assessments);
    const attempts = [...(item.assessment_attempts ?? [])].sort((a, b) => b.attempt_number - a.attempt_number);
    return { id: item.id, status: item.status, assignedAt: item.assigned_at, assessment: assessment ? { id: assessment.id, title: assessment.title, difficulty: assessment.difficulty, dueAt: assessment.due_at, questions: (assessment.questions as Parameters<typeof hideQuestionAnswers>[0][]).map(hideQuestionAnswers) } : null, attempts };
  });
  return NextResponse.json({ assignments: rows });
}
