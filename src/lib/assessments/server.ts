import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentQuestion } from "@/lib/assessments/types";
export { shuffle as shuffled } from "@/lib/random";

export function createAssessmentAdminClient() {
  return createAdminClient();
}

export async function getRequestUser() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function signQuestionImages(admin: NonNullable<ReturnType<typeof createAssessmentAdminClient>>, questions: AssessmentQuestion[]) {
  return Promise.all(questions.map(async (question) => {
    if (question.type !== "vocabulary" || !question.imagePath) return question;
    const { data } = await admin.storage.from("vocabulary-images").createSignedUrl(question.imagePath, 60 * 60);
    return { ...question, imageUrl: data?.signedUrl ?? null };
  }));
}

export function hideQuestionAnswers(question: AssessmentQuestion) {
  return { ...question, answer: undefined };
}
