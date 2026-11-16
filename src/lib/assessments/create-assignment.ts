import type { AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";
import { generateAssessmentQuestions } from "@/lib/assessments/question-generation";
import { loadAssessmentQuestionSources } from "@/lib/assessments/question-sources";
import {
  resolveAssessmentRecipientIds,
  type AssessmentRecipientSelection,
} from "@/lib/assessments/recipient-selection";

type AssignmentDetails = {
  title: string;
  difficulty: AssessmentDifficulty;
  dueAt: Date | null;
};

type CreatedAssessment = {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  due_at: string | null;
};

export type CreateAssessmentAssignmentResult =
  | { status: "source_error"; message: string }
  | { status: "questions_unavailable" }
  | { status: "recipient_lookup_error"; message: string }
  | { status: "no_recipients" }
  | { status: "assignment_error"; message: string }
  | { status: "recipient_insert_error"; message: string }
  | { status: "created"; assignment: CreatedAssessment; recipientCount: number };

export async function createAssessmentAssignment(
  admin: AdminClient,
  createdBy: string,
  details: AssignmentDetails,
  selection: AssessmentRecipientSelection,
): Promise<CreateAssessmentAssignmentResult> {
  const { title, difficulty, dueAt } = details;
  const sourceResult = await loadAssessmentQuestionSources(admin, difficulty);
  if (sourceResult.status === "error") {
    return { status: "source_error", message: sourceResult.message };
  }

  const questions = generateAssessmentQuestions({
    ...sourceResult.sources,
    difficulty,
  });
  if (!questions) return { status: "questions_unavailable" };

  const recipientResolution = await resolveAssessmentRecipientIds(admin, selection);
  if (recipientResolution.status === "error") {
    return { status: "recipient_lookup_error", message: recipientResolution.message };
  }
  const recipientIds = recipientResolution.recipientIds;
  if (!recipientIds.length) return { status: "no_recipients" };

  const { data: assignment, error: assignmentError } = await admin.from("assessments").insert({
    title,
    difficulty,
    questions,
    due_at: dueAt?.toISOString() ?? null,
    created_by: createdBy,
  }).select("id,title,difficulty,due_at").single();
  if (assignmentError || !assignment) {
    return { status: "assignment_error", message: assignmentError?.message ?? "Could not create assignment." };
  }

  const recipientRows = recipientIds.map((userId) => ({ assessment_id: assignment.id, user_id: userId }));
  const { data: recipients, error: recipientError } = await admin.from("assessment_recipients").insert(recipientRows).select("id,user_id");
  if (recipientError || !recipients) {
    await admin.from("assessments").delete().eq("id", assignment.id);
    return { status: "recipient_insert_error", message: recipientError?.message ?? "Could not assign learners." };
  }

  return { status: "created", assignment, recipientCount: recipientIds.length };
}
