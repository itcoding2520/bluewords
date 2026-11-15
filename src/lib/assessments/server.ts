import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/supabase/admin-access";
import type { AssessmentQuestion } from "@/lib/assessments/types";
export { shuffle as shuffled } from "@/lib/random";

export function createAssessmentAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) return null;
  return createSupabaseClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
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
