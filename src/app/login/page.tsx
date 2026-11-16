
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";
import { getCurrentUserClaimsOrNull } from "@/lib/supabase/authenticated-user";

export default async function LoginPage() {
  const supabase = await createClient();

  const claims = await getCurrentUserClaimsOrNull(supabase);
  if (claims) redirect("/");

  return <LoginForm />;
}
