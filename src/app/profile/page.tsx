import { redirect } from "next/navigation";

import { AppLayout } from "@/components/layout/AppLayout";
import { UserProfileContent } from "@/components/profile/UserProfileContent";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  const userId = typeof data.claims.sub === "string" ? data.claims.sub : "";
  const email = typeof data.claims.email === "string" ? data.claims.email : null;

  return <AppLayout><UserProfileContent userId={userId} email={email} /></AppLayout>;
}
