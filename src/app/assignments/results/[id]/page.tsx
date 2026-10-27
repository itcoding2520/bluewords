import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AssessmentReview } from "@/components/assignments/AssessmentReview";

export default async function AssessmentResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please <Link className="text-blue-600" href="/login">sign in</Link> to view your result.</p>;
  const { id } = await params;
  return <AssessmentReview attemptId={id} />;
}
