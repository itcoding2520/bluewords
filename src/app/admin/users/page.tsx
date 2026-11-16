import { AdminUsersManagement } from "@/components/admin/AdminUsersManagement";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminUsersPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <AdminUsersManagement />;
}
