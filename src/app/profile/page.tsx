import { redirect } from "next/navigation";

import { UserProfileContent } from "@/components/profile/UserProfileContent";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function ProfilePage() {
  const supabase = await createClient();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  if (!claims) redirect("/login");

  const userId = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email : null;

  return <UserProfileContent userId={userId} email={email} />;
}
