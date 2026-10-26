import { WordSearchContent } from "@/components/games/WordSearchContent";
import { createClient } from "@/lib/supabase/server";

export default async function WordSearchPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId = !error && typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  return <WordSearchContent userId={userId} />;
}
