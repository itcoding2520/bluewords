import { AdminNavigation } from "@/components/admin/AdminNavigation";
import { AdminAssessments } from "@/components/admin/AdminAssessments";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminAssessmentsPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <><AdminNavigation active="assessments" /><AdminAssessments /></>;
}
