import { SentenceBuilderContent } from "@/components/games/SentenceBuilderContent";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SentenceBuilderPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="mx-auto max-w-xl rounded-3xl border border-sky-100 bg-white p-6 text-center shadow-sm sm:p-10"><span className="text-5xl" aria-hidden="true">🔒</span><h1 className="mt-4 text-2xl font-black text-slate-900">Sign in to play Sentence Builder</h1><p className="mt-2 text-sm leading-6 text-slate-600">This game is available to signed-in BlueWords learners. Sign in or create an account to start building sentences.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 font-bold text-white">Sign in or create account</Link></div></main>;
  return <SentenceBuilderContent />;
}
