import { GamesContent } from "@/components/games/GamesContent";
import { createClient } from "@/lib/supabase/server";

export default async function GamesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  return <GamesContent isAuthenticated={!error && Boolean(data?.claims)} />;
}
