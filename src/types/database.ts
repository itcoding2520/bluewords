
export type VocabularyWordRow = {
  id: string;
  user_id: string;
  word: string;
  meaning: string;
  category: "Daily" | "Work" | "Frontend";
  status: "learning" | "mastered";
  created_at: string;
  updated_at: string;
};

export type VocabularyWordInsert = {
  user_id: string;
  word: string;
  meaning: string;
  category: VocabularyWordRow["category"];
  status?: VocabularyWordRow["status"];
};

export type VocabularyWordUpdate = Partial<
  Pick<
    VocabularyWordRow,
    "word" | "meaning" | "category" | "status"
  >
>;
