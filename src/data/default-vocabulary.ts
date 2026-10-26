import seedEntries from "@/data/default-vocabulary.json";
import type { PartOfSpeech } from "@/config/vocabulary";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

const entries = seedEntries as Array<{
  id: string;
  word: string;
  meaning: string;
  category: string;
  status: "learning";
  type: "word" | "expression";
  ipa: string | null;
  imagePath: string | null;
  partOfSpeech: string | null;
  categoryColor: VocabularyCategoryRow["color"];
}>;

export const defaultVocabularyWords: VocabularyWord[] = entries.map((entry) => ({
  id: entry.id,
  word: entry.word,
  meaning: entry.meaning,
  category: entry.category,
  status: entry.status,
  type: entry.type,
  ipa: entry.ipa,
  imagePath: entry.imagePath,
  detailedMeanings: entry.partOfSpeech
    ? [{ partOfSpeech: entry.partOfSpeech as PartOfSpeech, meaning: entry.meaning }]
    : [],
}));

export const defaultVocabularyCategories: VocabularyCategoryRow[] = [
  ...new Map(entries.map((entry) => [entry.category, entry.categoryColor] as const)).entries(),
].map(([name, color]) => ({
  id: `default-category-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
  user_id: "guest",
  name,
  color,
  image_path: null,
  is_default: true,
  created_at: "",
  updated_at: "",
}));
