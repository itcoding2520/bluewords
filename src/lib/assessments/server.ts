import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createAdminClient, type AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentQuestion } from "@/lib/assessments/types";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export type AssessmentUserResult = { user: User } | { response: NextResponse };

export async function getRequestUser() {
  const client = await createClient();
  return getCurrentUserOrNull(client);
}

export async function requireAssessmentUser(message: string): Promise<AssessmentUserResult> {
  const user = await getRequestUser();
  if (!user) return { response: jsonErrorResponse(message, 401) };
  return { user };
}

export function getAssessmentAdminClient(): AdminClient | NextResponse {
  const admin = createAdminClient();
  return admin ?? jsonErrorResponse("Assessment service is not configured.", 503);
}

export type AssessmentAdminContextResult =
  | { user: User; admin: AdminClient }
  | { response: NextResponse };

export async function requireAssessmentAdminContext(
  message: string
): Promise<AssessmentAdminContextResult> {
  const auth = await requireAssessmentUser(message);
  if ("response" in auth) return auth;

  const admin = getAssessmentAdminClient();
  if (admin instanceof NextResponse) return { response: admin };
  return { user: auth.user, admin };
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
