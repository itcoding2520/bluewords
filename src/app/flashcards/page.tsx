import { redirect } from "next/navigation";

import { FlashcardsContent } from "@/components/flashcards/FlashcardsContent";
import { createClient } from "@/lib/supabase/server";

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return <FlashcardsContent />;
}
