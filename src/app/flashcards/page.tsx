import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { FlashcardsContent } from "@/components/flashcards/FlashcardsContent";
import { createClient } from "@/lib/supabase/server";

export default async function FlashcardsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <AppLayout>
      <FlashcardsContent />
    </AppLayout>
  );
}
