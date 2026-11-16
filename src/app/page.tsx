import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { GuestHomeContent } from "@/components/dashboard/GuestHomeContent";
import { formatDate, getGreeting } from "@/lib/formatDate";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const now = new Date();
  const claims = await getCurrentUserClaimsOrNull(supabase);
  const localDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
  );

  if (!claims) return <GuestHomeContent />;

  const userId = String(claims.sub);
  const isAdmin = await isAdminUser(supabase, userId);

  return <DashboardContent
    dateLabel={formatDate(localDate)}
    greeting={getGreeting(localDate)}
    userId={userId}
    isAdmin={isAdmin}
  />;
}
