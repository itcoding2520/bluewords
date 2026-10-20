import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { WordSearchContent } from "@/components/games/WordSearchContent";
import { createClient } from "@/lib/supabase/server";

export default async function WordSearchPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";

  return <AppLayout><WordSearchContent userId={userId} /></AppLayout>;
}
