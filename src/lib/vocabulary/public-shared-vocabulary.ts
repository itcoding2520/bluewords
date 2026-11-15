import type { PublicSharedVocabulary } from "@/lib/vocabulary/public-shared-vocabulary-mapping";

export { mapPublicCategories, mapPublicWords } from "@/lib/vocabulary/public-shared-vocabulary-mapping";
export type { PublicSharedVocabulary } from "@/lib/vocabulary/public-shared-vocabulary-mapping";

export async function loadPublicSharedVocabulary(): Promise<PublicSharedVocabulary> {
  const response = await fetch("/api/public-vocabulary");
  if (!response.ok) throw new Error("Could not load approved shared vocabulary.");
  return await response.json() as PublicSharedVocabulary;
}
