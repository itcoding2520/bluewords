import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { getPublicVocabulary } from "@/lib/supabase/public-vocabulary";

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: "Shared vocabulary is not configured." }, { status: 503 });
  const result = await getPublicVocabulary(supabase);
  if (result.status === "error") return NextResponse.json({ error: result.message }, { status: 500 });
  return NextResponse.json({ categories: result.categories, words: result.words }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
