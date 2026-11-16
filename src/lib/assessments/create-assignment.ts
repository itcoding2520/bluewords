import type { AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";
import {
  persistAssessmentAssignment,
  type AssessmentAssignmentPersistenceResult,
} from "@/lib/assessments/assignment-persistence";
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

export type CreateAssessmentAssignmentResult =
  | { status: "source_error"; message: string }
  | { status: "questions_unavailable" }
  | { status: "recipient_lookup_error"; message: string }
  | { status: "no_recipients" }
  | AssessmentAssignmentPersistenceResult;

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

  return persistAssessmentAssignment(admin, {
    title,
    difficulty,
    dueAt,
    createdBy,
    questions,
    recipientIds,
  });
}
