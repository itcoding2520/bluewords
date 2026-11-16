import { useEffect, useMemo, useState } from "react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { loadSentenceBuilderQuestions } from "@/lib/supabase/sentence-builder";
import type { SentenceBuilderQuestion, SentenceDifficulty } from "@/lib/sentence-builder";

export function useSentenceBuilderSetupData({
  vocabularyCategories,
  difficulty,
  category,
}: {
  vocabularyCategories: VocabularyCategoryRow[];
  difficulty: SentenceDifficulty;
  category: string;
}) {
  const [questions, setQuestions] = useState<SentenceBuilderQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const questionsByDifficulty = useMemo(() => {
    const grouped = new Map<SentenceDifficulty, SentenceBuilderQuestion[]>();
    for (const question of questions) {
      const difficultyQuestions = grouped.get(question.difficulty);
      if (difficultyQuestions) difficultyQuestions.push(question);
      else grouped.set(question.difficulty, [question]);
    }
    return grouped;
  }, [questions]);
  const difficultyQuestions = useMemo(
    () => questionsByDifficulty.get(difficulty) ?? [],
    [difficulty, questionsByDifficulty],
  );
  const eligible = useMemo(
    () => difficultyQuestions.filter((question) => category === "all" || question.category.toLocaleLowerCase() === category.toLocaleLowerCase()),
    [category, difficultyQuestions],
  );
  const vocabularyCategoriesByName = useMemo(
    () => new Map(vocabularyCategories.map((item) => [item.name.toLocaleLowerCase(), item])),
    [vocabularyCategories],
  );
  const categories = useMemo(() => {
    const names = [...new Set(difficultyQuestions.map((question) => question.category))].sort((a, b) => a.localeCompare(b));
    return names.map((name): VocabularyCategoryRow => vocabularyCategoriesByName.get(name.toLocaleLowerCase()) ?? {
      id: `sentence-builder-${name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`, user_id: "", name, color: "blue", image_path: null, is_default: true, created_at: "", updated_at: "",
    });
  }, [difficultyQuestions, vocabularyCategoriesByName]);

  useEffect(() => {
    let active = true;
    void loadSentenceBuilderQuestions().then((data) => { if (active) setQuestions(data); }).catch(() => { if (active) setQuestions([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { questions, loading, eligible, categories };
}
