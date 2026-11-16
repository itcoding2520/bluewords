import { QuizGameContent } from "@/components/quiz/QuizGameContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function QuizPage() {
  const supabase = await createClient();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  return <QuizGameContent userId={userId} />;
}
