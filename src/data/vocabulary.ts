import type {
  PartOfSpeech,
  VocabularyCategory,
  VocabularyType,
} from "@/config/vocabulary";

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
  Daily: "bg-blue-50 text-blue-700",
  Frontend: "bg-violet-50 text-violet-700",
  Work: "bg-orange-50 text-orange-700",
};