
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect("/");
  }

  return <LoginForm />;
}
