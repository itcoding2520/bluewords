import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentQuestion } from "@/lib/assessments/types";

export type AssessmentUserResult = { user: User } | { response: NextResponse };

export async function getRequestUser() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  return user;
}

export async function requireAssessmentUser(message: string): Promise<AssessmentUserResult> {
  const user = await getRequestUser();
  if (!user) return { response: NextResponse.json({ error: message }, { status: 401 }) };
  return { user };
}

export function getAssessmentAdminClient(): AdminClient | NextResponse {
  const admin = createAdminClient();
  return admin ?? NextResponse.json({ error: "Assessment service is not configured." }, { status: 503 });
}

export async function signQuestionImages(admin: AdminClient, questions: AssessmentQuestion[]) {
  return Promise.all(questions.map(async (question) => {
    if (question.type !== "vocabulary" || !question.imagePath) return question;
    const { data } = await admin.storage.from("vocabulary-images").createSignedUrl(question.imagePath, 60 * 60);
    return { ...question, imageUrl: data?.signedUrl ?? null };
  }));
}

export function hideQuestionAnswers(question: AssessmentQuestion) {
  return { ...question, answer: undefined };
}
