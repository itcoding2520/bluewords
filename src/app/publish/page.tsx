import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublishVocabularyContent } from "@/components/publish/PublishVocabularyContent";
import { isAdminUser } from "@/lib/supabase/admin-access";

export default async function PublishPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (await isAdminUser(supabase, user.id)) redirect("/admin");
  return <PublishVocabularyContent />;
}
