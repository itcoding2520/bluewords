import { redirect } from "next/navigation";

import { ReviewHistoryContent } from "@/components/reviews/ReviewHistoryContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  if (!claims) redirect("/login");

  const userId = typeof claims.sub === "string" ? claims.sub : "";

  return <ReviewHistoryContent userId={userId} />;
}
