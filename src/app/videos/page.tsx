import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VideosContent } from "@/components/videos/VideosContent";

export default async function VideosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-950">Videos</h1>
        <p className="mt-2 text-slate-600">Sign in to watch the video library.</p>
        <Link href="/login" className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
          Sign in
        </Link>
      </div>
    );
  }

  const { data: admin } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return <VideosContent isAdmin={Boolean(admin)} />;
}
