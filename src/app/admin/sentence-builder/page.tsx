import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminSentenceBuilderManagement } from "@/components/admin/AdminSentenceBuilderManagement";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { isAdminUser } from "@/lib/supabase/admin-access";

export default async function AdminSentenceBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p className="py-12 text-center text-slate-600">Please <Link className="text-blue-600" href="/login">sign in</Link> to continue.</p>;
  if (!await isAdminUser(supabase, user.id)) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">You do not have permission to access admin tools.</p>;
  return <><AdminNavigation active="sentence-builder" /><AdminSentenceBuilderManagement /></>;
}
