import { GamesContent } from "@/components/games/GamesContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function GamesPage() {
  const supabase = await createClient();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  return <GamesContent isAuthenticated={Boolean(claims)} />;
}
