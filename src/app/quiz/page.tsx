import { QuizGameContent } from "@/components/quiz/QuizGameContent";
import { createClient } from "@/lib/supabase/server";

export default async function QuizPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId = !error && typeof data?.claims?.sub === "string" ? data.claims.sub : null;

  return <QuizGameContent userId={userId} />;
}
