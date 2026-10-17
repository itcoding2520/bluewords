import type { VocabularyCategory } from "@/config/vocabulary";

export type VocabularyStatus = "learning" | "mastered";

export interface VocabularyWord {
  id: string;
  word: string;
  meaning: string;
  category: VocabularyCategory;
  status: VocabularyStatus;
}

export const initialVocabulary: VocabularyWord[] = [
  {
    id: "1",
    word: "steadily",
    meaning: "in a regular and continuous way",
    category: "Daily",
    status: "learning",
  },
  {
    id: "2",
    word: "confident",
    meaning: "feeling certain about your abilities",
    category: "Work",
    status: "mastered",
  },
  {
    id: "3",
    word: "accomplish",
    meaning: "to succeed in doing something",
    category: "Daily",
    status: "mastered",
  },
  {
    id: "4",
    word: "maintain",
    meaning: "to keep something at the same level",
    category: "Work",
    status: "learning",
  },
  {
    id: "5",
    word: "implement",
    meaning: "to put a plan or system into action",
    category: "Frontend",
    status: "learning",
  },
];

export const categoryStyles: Record<string, string> = {
  Daily: "bg-blue-50 text-blue-700",
  Frontend: "bg-violet-50 text-violet-700",
  Work: "bg-orange-50 text-orange-700",
};