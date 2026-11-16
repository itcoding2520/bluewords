import type {
  PartOfSpeech,
  VocabularyCategory,
  VocabularyCategoryColor,
  VocabularyType,
} from "@/config/vocabulary";
import type { LearningStatus } from "@/types/learning";

export type VocabularyStatus = LearningStatus;

export interface VocabularyMeaning {
  id?: string;
  partOfSpeech: PartOfSpeech;
  meaning: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  category: VocabularyCategory;
  status: VocabularyStatus;

  // Optional trong giai đoạn chuyển đổi để tương thích dữ liệu Phase 1.
  type?: VocabularyType;
  detailedMeanings?: VocabularyMeaning[];
  imagePath?: string | null;
  /** Temporary server-signed URL for approved public vocabulary images. */
  imageUrl?: string | null;
  ipa?: string | null;
  /** Approved shared vocabulary is read-only and has no per-user study status. */
  isCustom?: boolean;
}

export const categoryStyles: Record<string, string> = {
  Daily: "bg-blue-50 text-white",
  Frontend: "bg-[#bf00ff] text-white",
  Work: "bg-[#ff990a] text-white",
};

export const categorySolidColorStyles: Record<
  VocabularyCategoryColor,
  string
> = {
  blue: "bg-blue-700 text-white",
  violet: "bg-[#bf00ff] text-white",
  orange: "bg-[#ff990a] text-white",
  green: "bg-emerald-700 text-white",
  rose: "bg-rose-700 text-white",
  indigo: "bg-indigo-700 text-white",
  teal: "bg-teal-700 text-white",
  amber: "bg-amber-700 text-white",
  pink: "bg-pink-700 text-white",
  slate: "bg-slate-700 text-white",
};

export const categorySolidStyles: Record<string, string> = {
  Daily: "bg-blue-700 text-white",
  Frontend: "bg-[#bf00ff] text-white",
  Work: "bg-[#ff990a] text-white",
};
