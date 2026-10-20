import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { QuizGameContent } from "@/components/quiz/QuizGameContent";
import { createClient } from "@/lib/supabase/server";

export default async function QuizPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";

  return (
    <AppLayout>
      <QuizGameContent userId={userId} />
    </AppLayout>
  );
}
