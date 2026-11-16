import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import type { AdminClient } from "@/lib/supabase/admin-client";

export type CreatedAssessment = {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  due_at: string | null;
};

export type AssessmentAssignmentPersistenceResult =
  | { status: "assignment_error"; message: string }
  | { status: "recipient_insert_error"; message: string }
  | { status: "created"; assignment: CreatedAssessment; recipientCount: number };

export async function persistAssessmentAssignment(
  admin: AdminClient,
  input: {
    title: string;
    difficulty: AssessmentDifficulty;
    dueAt: Date | null;
    createdBy: string;
    questions: AssessmentQuestion[];
    recipientIds: string[];
  },
): Promise<AssessmentAssignmentPersistenceResult> {
  const { data: assignment, error: assignmentError } = await admin.from("assessments").insert({
    title: input.title,
    difficulty: input.difficulty,
    questions: input.questions,
    due_at: input.dueAt?.toISOString() ?? null,
    created_by: input.createdBy,
  }).select("id,title,difficulty,due_at").single();
  if (assignmentError || !assignment) {
    return { status: "assignment_error", message: assignmentError?.message ?? "Could not create assignment." };
  }

  const recipientRows = input.recipientIds.map((userId) => ({ assessment_id: assignment.id, user_id: userId }));
  const { data: recipients, error: recipientError } = await admin.from("assessment_recipients").insert(recipientRows).select("id,user_id");
  if (recipientError || !recipients) {
    await admin.from("assessments").delete().eq("id", assignment.id);
    return { status: "recipient_insert_error", message: recipientError?.message ?? "Could not assign learners." };
  }

  return { status: "created", assignment, recipientCount: input.recipientIds.length };
}
