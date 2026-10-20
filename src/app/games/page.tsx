import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { GamesContent } from "@/components/games/GamesContent";
import { createClient } from "@/lib/supabase/server";

export default async function GamesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  return <AppLayout><GamesContent /></AppLayout>;
}
