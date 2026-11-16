import { AdminNotificationComposer } from "@/components/admin/AdminNotificationComposer";
import { AdminPageAccessState } from "@/components/admin/AdminPageAccessState";
import { getAdminPageAccess } from "@/lib/supabase/admin-page-access";

export default async function AdminNotificationsPage() {
  const access = await getAdminPageAccess();
  if (access.status !== "authorized") return <AdminPageAccessState status={access.status} />;

  return <AdminNotificationComposer currentUserId={access.user.id} />;
}
