import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminNotificationComposer } from "@/components/admin/AdminNotificationComposer";

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="py-12 text-center text-slate-600">Please <Link className="text-blue-600" href="/login">sign in</Link> to continue.</p>;

  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!admin) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">You do not have permission to access admin tools.</p>;

  return <AdminNotificationComposer currentUserId={user.id} />;
}
