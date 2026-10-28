import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET() {
  if (!serviceKey) return NextResponse.json({ error: "Shared vocabulary is not configured." }, { status: 503 });
  const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const [categoryResult, wordResult] = await Promise.all([
    supabase.from("community_categories").select("id, name, color, image_path").eq("status", "published").order("name"),
    supabase.from("community_words").select("id, word, meaning, ipa, category_id, image_path").eq("status", "published").order("word"),
  ]);
  if (categoryResult.error || wordResult.error) {
    return NextResponse.json({ error: categoryResult.error?.message ?? wordResult.error?.message ?? "Could not load shared vocabulary." }, { status: 500 });
  }
  const categories = (categoryResult.data ?? []).map(({ id, name, color, image_path }) => ({ id, name, color, image_path }));
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const publishedWords = (wordResult.data ?? []).filter((item) => categoryNames.has(item.category_id));
  const imagePaths = [...new Set(publishedWords.flatMap((item) => item.image_path ? [item.image_path] : []))];
  const signedImages = imagePaths.length
    ? await supabase.storage.from("vocabulary-images").createSignedUrls(imagePaths, 60 * 60)
    : { data: [] };
  const imageUrls = new Map((signedImages.data ?? []).map((image) => [image.path, image.signedUrl]));
  const words = publishedWords.map((item) => ({
    id: item.id,
    word: item.word,
    meaning: item.meaning,
    ipa: item.ipa,
    imageUrl: item.image_path ? imageUrls.get(item.image_path) ?? null : null,
    categoryId: item.category_id,
    category: categoryNames.get(item.category_id) ?? "",
  })).filter((item) => item.category);
  return NextResponse.json({ categories, words }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
