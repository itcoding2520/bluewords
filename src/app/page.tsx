import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { formatDate, getGreeting } from "@/lib/formatDate";

export const dynamic = "force-dynamic";

export default function Home() {
  const now = new Date();

  const localDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
    })
  );

  return (
    <AppLayout>
      <DashboardContent
        dateLabel={formatDate(localDate)}
        greeting={getGreeting(localDate)}
      />
    </AppLayout>
  );
}