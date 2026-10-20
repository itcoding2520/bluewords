import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
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

  if (error || !data?.claims) {
    redirect("/login");
  }

  return <DashboardContent
    dateLabel={formatDate(localDate)}
    greeting={getGreeting(localDate)}
    userId={data.claims.sub}
  />;
}
