import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AssignmentsContent } from "@/components/assignments/AssignmentsContent";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const user = await getCurrentUserOrNull(supabase);
  if (!user) return <section className="assessment-login-card"><h1>Assignments</h1><p>Sign in to view tests assigned to you and keep your results private.</p><Link href="/login?next=/assignments">Sign in to continue</Link></section>;
  return <AssignmentsContent />;
}
