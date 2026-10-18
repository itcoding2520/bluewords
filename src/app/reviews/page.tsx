import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { ReviewHistoryContent } from "@/components/reviews/ReviewHistoryContent";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";

  return (
    <AppLayout>
      <ReviewHistoryContent userId={userId} />
    </AppLayout>
  );
}
