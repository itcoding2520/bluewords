import { Sparkles } from "lucide-react";
import { AdminReviewPublishedForms } from "@/components/admin/AdminReviewPublishedForms";
import { AdminReviewPublishedLists } from "@/components/admin/AdminReviewPublishedLists";
import type { PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
import { isDefaultVocabularyCategory } from "@/lib/vocabulary/default-categories";

interface AdminReviewPublishedVocabularyProps {
  categories: PublishedCategory[];
  words: PublishedWord[];
  ownerEmails: Record<string, string>;
  newCategory: string;
  onNewCategoryChange: (value: string) => void;
  newWord: string;
  onNewWordChange: (value: string) => void;
  newMeaning: string;
  onNewMeaningChange: (value: string) => void;
  newWordCategory: string;
  onNewWordCategoryChange: (value: string) => void;
  onAddCategory: () => void | Promise<void>;
  onAddWord: () => void | Promise<void>;
  onRemove: (table: "community_categories" | "community_words", item: PublishedCategory | PublishedWord) => void | Promise<void>;
  onEditCategory: (category: PublishedCategory) => void | Promise<void>;
  onEditWord: (word: PublishedWord) => void | Promise<void>;
}

export function AdminReviewPublishedVocabulary({
  categories,
  words,
  ownerEmails,
  newCategory,
  onNewCategoryChange,
  newWord,
  onNewWordChange,
  newMeaning,
  onNewMeaningChange,
  newWordCategory,
  onNewWordCategoryChange,
  onAddCategory,
  onAddWord,
  onRemove,
  onEditCategory,
  onEditWord,
}: AdminReviewPublishedVocabularyProps) {
  const customCategories = categories.filter((item) =>
    !isDefaultVocabularyCategory(item.name)
  );

  return (
    <section className="admin-review-published mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="admin-review-published-title"><Sparkles size={22} /> Published custom vocabulary</h2>
      <AdminReviewPublishedForms
        categories={categories}
        newCategory={newCategory}
        onNewCategoryChange={onNewCategoryChange}
        newWord={newWord}
        onNewWordChange={onNewWordChange}
        newMeaning={newMeaning}
        onNewMeaningChange={onNewMeaningChange}
        newWordCategory={newWordCategory}
        onNewWordCategoryChange={onNewWordCategoryChange}
        onAddCategory={onAddCategory}
        onAddWord={onAddWord}
      />
      <AdminReviewPublishedLists
        categories={customCategories}
        words={words}
        ownerEmails={ownerEmails}
        onRemove={onRemove}
        onEditCategory={onEditCategory}
        onEditWord={onEditWord}
      />
    </section>
  );
}
