import type { AdminClient } from "@/lib/supabase/admin-client";
import type { AssessmentDifficulty } from "@/lib/assessments/assignment-input";

export async function loadAssessmentQuestionSources(
  admin: AdminClient,
  difficulty: AssessmentDifficulty,
) {
  const [defaultKeyResult, vocabularyResult, communityResult, sentenceResult] = await Promise.all([
    admin.from("default_vocabulary_keys").select("normalized_word"),
    admin.from("vocabulary_words").select("word,meaning,category,image_path,type").limit(5000),
    admin.from("community_words").select("word,meaning,image_path,community_categories!inner(name)").eq("status", "published").eq("community_categories.status", "published").limit(1000),
    admin.from("sentence_builder_questions").select("difficulty,category,prompt_vi,answer_sentence,answer_tokens,distractor_tokens,image_keyword,is_active").eq("difficulty", difficulty).eq("is_active", true).limit(1000),
  ]);

  const error = defaultKeyResult.error
    ?? vocabularyResult.error
    ?? communityResult.error
    ?? sentenceResult.error;
  if (error) return { status: "error" as const, message: error.message };

  return {
    status: "loaded" as const,
    sources: {
      defaultKeys: defaultKeyResult.data,
      vocabularyRows: vocabularyResult.data,
      communityWords: communityResult.data,
      sentenceQuestions: sentenceResult.data,
    },
  };
}
