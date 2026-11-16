import { AdminReviewContent } from "@/components/admin/AdminReviewContent";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <AdminReviewContent />;
}
