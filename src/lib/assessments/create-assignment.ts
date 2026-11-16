import type { AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";
import { generateAssessmentQuestions } from "@/lib/assessments/question-generation";

type AssignmentDetails = {
  title: string;
  difficulty: AssessmentDifficulty;
  dueAt: Date | null;
};

type RecipientSelection = {
  allUsers: unknown;
  recipientIds: unknown;
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
  selection: RecipientSelection,
): Promise<CreateAssessmentAssignmentResult> {
  const { title, difficulty, dueAt } = details;
  const [{ data: defaultKeys, error: keyError }, { data: wordsData, error: wordError }, { data: sharedData, error: sharedError }, { data: sentencesData, error: sentenceError }] = await Promise.all([
    admin.from("default_vocabulary_keys").select("normalized_word"),
    admin.from("vocabulary_words").select("word,meaning,category,image_path,type").limit(5000),
    admin.from("community_words").select("word,meaning,image_path,community_categories!inner(name)").eq("status", "published").eq("community_categories.status", "published").limit(1000),
    admin.from("sentence_builder_questions").select("difficulty,category,prompt_vi,answer_sentence,answer_tokens,distractor_tokens,image_keyword,is_active").eq("difficulty", difficulty).eq("is_active", true).limit(1000),
  ]);
  const sourceError = keyError ?? wordError ?? sharedError ?? sentenceError;
  if (sourceError) return { status: "source_error", message: sourceError.message };

  const questions = generateAssessmentQuestions({
    defaultKeys,
    vocabularyRows: wordsData,
    communityWords: sharedData,
    sentenceQuestions: sentencesData,
    difficulty,
  });
  if (!questions) return { status: "questions_unavailable" };

  let recipientIds: string[] = [];
  if (selection.allUsers === true) {
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 500 });
      if (error) return { status: "recipient_lookup_error", message: error.message };
      recipientIds.push(...data.users.map((entry) => entry.id));
      if (data.users.length < 500) break;
      page++;
    }
  } else if (Array.isArray(selection.recipientIds)) {
    recipientIds = [...new Set(selection.recipientIds.filter((id): id is string => typeof id === "string"))];
  }
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
