import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsContent } from "@/components/notifications/NotificationsContent";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <NotificationsContent />;
}
