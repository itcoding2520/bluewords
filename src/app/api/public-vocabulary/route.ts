import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getPublicVocabulary } from "@/lib/supabase/public-vocabulary";
import { jsonErrorResponse } from "@/lib/api/json-error-response";

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return jsonErrorResponse("Shared vocabulary is not configured.", 503);
  const result = await getPublicVocabulary(supabase);
  if (result.status === "error") return jsonErrorResponse(result.message, 500);
  return NextResponse.json({ categories: result.categories, words: result.words }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
