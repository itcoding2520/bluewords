import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { GuestHomeContent } from "@/components/dashboard/GuestHomeContent";
import { formatDate, getGreeting } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const now = new Date();
  const { data, error } = await supabase.auth.getClaims();
  const localDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
  );

  if (error || !data?.claims) return <GuestHomeContent />;

  const userId = String(data.claims.sub);
  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return <DashboardContent
    dateLabel={formatDate(localDate)}
    greeting={getGreeting(localDate)}
    userId={userId}
    isAdmin={Boolean(admin)}
  />;
}
