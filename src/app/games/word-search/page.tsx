import { WordSearchContent } from "@/components/games/WordSearchContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function WordSearchPage() {
  const supabase = await createClient();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  return <WordSearchContent userId={userId} />;
}
