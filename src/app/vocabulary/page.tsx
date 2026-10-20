import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VocabularyContent } from "@/components/vocabulary/VocabularyContent";

export default async function VocabularyPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }
  
  return <VocabularyContent />;
}
