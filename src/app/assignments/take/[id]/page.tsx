import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AssessmentRunner } from "@/components/assignments/AssessmentRunner";

export default async function TakeAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please <Link className="text-blue-600" href="/login">sign in</Link> to take this test.</p>;
  const { id } = await params;
  return <AssessmentRunner attemptId={id} />;
}
