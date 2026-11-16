import { AdminSentenceBuilderManagement } from "@/components/admin/AdminSentenceBuilderManagement";
import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminSentenceBuilderPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <><AdminNavigation active="sentence-builder" /><AdminSentenceBuilderManagement /></>;
}
