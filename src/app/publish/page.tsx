import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublishVocabularyContent } from "@/components/publish/PublishVocabularyContent";

export default async function PublishPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: admin } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (admin) redirect("/admin");
  return <PublishVocabularyContent />;
}
