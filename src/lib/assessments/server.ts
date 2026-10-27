import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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
  const { data } = await client.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle();
  return Boolean(data);
}

export function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export type AssessmentQuestion =
  | { type: "vocabulary"; prompt: string; word: string; meaning: string; category: string; imagePath: string | null; imageUrl?: string | null; choices: string[]; answer: string }
  | { type: "sentence"; prompt: string; category: string; imageKeyword: string; tiles: string[]; answer: string };

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
