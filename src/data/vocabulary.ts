import type {
  PartOfSpeech,
  VocabularyCategory,
  VocabularyType,
} from "@/config/vocabulary";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";

export type VocabularyStatus = "learning" | "mastered";

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
  ipa?: string | null;
  /** Approved shared vocabulary is read-only and has no per-user study status. */
  isCustom?: boolean;
}

export const initialVocabulary: VocabularyWord[] = [
  {
    id: "1",
    word: "steadily",
    meaning: "in a regular and continuous way",
    category: "Daily",
    status: "learning",
    type: "word",
    detailedMeanings: [],
    imagePath: null,
  },
  {
    id: "2",
    word: "confident",
    meaning: "feeling certain about your abilities",
    category: "Work",
    status: "mastered",
    type: "word",
    detailedMeanings: [],
    imagePath: null,
  },
  {
    id: "3",
    word: "accomplish",
    meaning: "to succeed in doing something",
    category: "Daily",
    status: "mastered",
    type: "word",
    detailedMeanings: [],
    imagePath: null,
  },
  {
    id: "4",
    word: "maintain",
    meaning: "to keep something at the same level",
    category: "Work",
    status: "learning",
    type: "word",
    detailedMeanings: [],
    imagePath: null,
  },
  {
    id: "5",
    word: "implement",
    meaning: "to put a plan or system into action",
    category: "Frontend",
    status: "learning",
    type: "word",
    detailedMeanings: [],
    imagePath: null,
  },
];

export const categoryStyles: Record<string, string> = {
  Daily: "bg-blue-50 text-white",
  Frontend: "bg-[#bf00ff] text-white",
  Work: "bg-[#ff990a] text-white",
};

export const categoryColorStyles: Record<
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
