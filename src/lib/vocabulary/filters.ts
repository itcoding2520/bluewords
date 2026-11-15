import type { VocabularyCategory } from "@/config/vocabulary";
import type { VocabularyStatus } from "@/data/vocabulary";

export type CategoryFilter = "All" | VocabularyCategory;
export type VocabularyStatusFilter = "all" | VocabularyStatus;
