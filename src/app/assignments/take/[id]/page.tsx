import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AssessmentRunner } from "@/components/assignments/AssessmentRunner";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";

export default async function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const user = await getCurrentUserOrNull(supabase);
  if (!user) return <p>Please <Link className="text-blue-600" href="/login">sign in</Link> to take this test.</p>;
  const { id } = await params;
  return <AssessmentRunner attemptId={id} />;
}
