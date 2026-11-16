import type { AdminClient } from "@/lib/supabase/admin-client";

export async function getPublicVocabulary(adminClient: AdminClient) {
  const [categoryResult, wordResult] = await Promise.all([
    adminClient.from("community_categories").select("id, name, color, image_path").eq("status", "published").order("name"),
    adminClient.from("community_words").select("id, word, meaning, ipa, category_id, image_path").eq("status", "published").order("word"),
  ]);
  if (categoryResult.error || wordResult.error) {
    return {
      status: "error" as const,
      message: categoryResult.error?.message ?? wordResult.error?.message ?? "Could not load shared vocabulary.",
    };
  }

  const categories = categoryResult.data ?? [];
  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  const publishedWords = [];
  const imagePathSet = new Set<string>();
  for (const item of wordResult.data ?? []) {
    if (!categoryNames.has(item.category_id)) continue;
    publishedWords.push(item);
    if (item.image_path) imagePathSet.add(item.image_path);
  }
  const imagePaths = [...imagePathSet];
  const signedImages = imagePaths.length
    ? await adminClient.storage.from("vocabulary-images").createSignedUrls(imagePaths, 60 * 60)
    : { data: [] };
  const imageUrls = new Map((signedImages.data ?? []).map((image) => [image.path, image.signedUrl]));
  const words = [];
  for (const item of publishedWords) {
    const category = categoryNames.get(item.category_id) ?? "";
    if (!category) continue;
    words.push({
      id: item.id,
      word: item.word,
      meaning: item.meaning,
      ipa: item.ipa,
      imageUrl: item.image_path ? imageUrls.get(item.image_path) ?? null : null,
      categoryId: item.category_id,
      category,
    });
  }

  return { status: "success" as const, categories, words };
}
