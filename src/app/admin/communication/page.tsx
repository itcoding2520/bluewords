import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminCommunicationManagement } from "@/components/admin/AdminCommunicationManagement";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminCommunicationPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <><AdminNavigation active="communication" /><AdminCommunicationManagement /></>;
}
