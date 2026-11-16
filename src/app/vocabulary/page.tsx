import { createClient } from "@/lib/supabase/server";
import { VocabularyContent } from "@/components/vocabulary/VocabularyContent";
import { GuestVocabularyContent } from "@/components/vocabulary/GuestVocabularyContent";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function VocabularyPage() {
  const supabase = await createClient();

  const claims = await getCurrentUserClaimsOrNull(supabase);
  if (!claims) return <GuestVocabularyContent />;

  const userId = typeof claims.sub === "string" ? claims.sub : null;
  const isAdmin = userId ? await isAdminUser(supabase, userId) : false;
  return <VocabularyContent isAdmin={isAdmin} />;
}
