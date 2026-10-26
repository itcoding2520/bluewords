import { createClient } from "@/lib/supabase/server";
import { VocabularyContent } from "@/components/vocabulary/VocabularyContent";
import { GuestVocabularyContent } from "@/components/vocabulary/GuestVocabularyContent";

export default async function VocabularyPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return <GuestVocabularyContent />;

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : null;
  const { data: admin } = userId
    ? await supabase.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle()
    : { data: null };

  return <VocabularyContent isAdmin={Boolean(admin)} />;
}
