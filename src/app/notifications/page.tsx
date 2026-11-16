import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationsContent } from "@/components/notifications/NotificationsContent";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const user = await getCurrentUserOrNull(supabase);
  if (!user) redirect("/login");
  return <NotificationsContent />;
}
