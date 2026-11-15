import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { createAdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentQuestion } from "@/lib/assessments/types";
export { shuffle as shuffled } from "@/lib/random";

export function createAssessmentAdminClient() {
  return createAdminClient();
}

export async function getRequestUser() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}

export async function isAssessmentAdmin(client: Awaited<ReturnType<typeof createClient>>, userId: string) {
  return isAdminUser(client, userId);
}

export async function signQuestionImages(admin: NonNullable<ReturnType<typeof createAssessmentAdminClient>>, questions: AssessmentQuestion[]) {
  return Promise.all(questions.map(async (question) => {
    if (question.type !== "vocabulary" || !question.imagePath) return question;
    const { data } = await admin.storage.from("vocabulary-images").createSignedUrl(question.imagePath, 60 * 60);
    return { ...question, imageUrl: data?.signedUrl ?? null };
  }));
}

export function hideQuestionAnswers(question: AssessmentQuestion) {
  if (question.type === "vocabulary") return { ...question, answer: undefined };
  return { ...question, answer: undefined };
}
