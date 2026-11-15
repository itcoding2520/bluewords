import { createClient } from "@/lib/supabase/server";
import { VocabularyContent } from "@/components/vocabulary/VocabularyContent";
import { GuestVocabularyContent } from "@/components/vocabulary/GuestVocabularyContent";
import { isAdminUser } from "@/lib/supabase/admin-access";

export default async function VocabularyPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) return <GuestVocabularyContent />;

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : null;
  const isAdmin = userId ? await isAdminUser(supabase, userId) : false;
  return <VocabularyContent isAdmin={isAdmin} />;
}
