import { BookOpen, FolderOpen, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Select } from "@/components/ui/Select";
import { CategoryIdentity } from "@/components/vocabulary/CategoryAvatar";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import type { PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

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
    !defaultVocabularyCategories.some((category) =>
      normalizeVocabularyLabel(category.name) === normalizeVocabularyLabel(item.name)
    )
  );

  return (
    <section className="admin-review-published mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="admin-review-published-title"><Sparkles size={22} /> Published custom vocabulary</h2>

      <form
        className="admin-review-category-form mt-4 flex flex-wrap gap-2"
        onSubmit={(event) => { event.preventDefault(); void onAddCategory(); }}
      >
        <input
          value={newCategory}
          onChange={(event) => onNewCategoryChange(event.target.value)}
          placeholder="New category name"
          aria-label="New category name"
          className="min-w-48 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <Button type="submit"><Plus size={16} /> Add category</Button>
      </form>

      <form
        className="admin-review-word-form mt-3 grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => { event.preventDefault(); void onAddWord(); }}
      >
        <Select
          value={newWordCategory}
          onChange={(event) => onNewWordCategoryChange(event.target.value)}
          aria-label="Word category"
          containerClassName="admin-review-category-select"
          className="admin-review-category-select-control"
        >
          <option value="">Choose category</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        <input
          value={newWord}
          onChange={(event) => onNewWordChange(event.target.value)}
          placeholder="English word"
          aria-label="English word"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <input
          value={newMeaning}
          onChange={(event) => onNewMeaningChange(event.target.value)}
          placeholder="Meaning"
          aria-label="Word meaning"
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <Button type="submit" disabled={!newWordCategory || !newWord.trim()}>
          <Plus size={16} /> Add word
        </Button>
      </form>

      <div className="admin-review-published-lists mt-5 grid gap-4 lg:grid-cols-2">
        <div className="admin-review-published-list">
          <h3><FolderOpen size={18} /> Categories</h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {customCategories.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <CategoryIdentity
                  name={item.name}
                  imagePath={item.image_path}
                  fallbackWordImagePath={words.find((word) => word.category_id === item.id && word.image_path)?.image_path}
                  author={ownerEmails[item.owner_id] ?? "Loading author…"}
                />
                <ActionMenu
                  label={item.name}
                  actions={[
                    { label: "Edit", icon: <Pencil size={15} />, onSelect: () => void onEditCategory(item) },
                    { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void onRemove("community_categories", item), destructive: true },
                  ]}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-review-published-list">
          <h3><BookOpen size={18} /> Words</h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {words.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0">
                  <strong>{item.word}</strong>
                  <span className="ml-2 text-slate-500">{item.meaning}</span>
                  <span className="block text-xs text-slate-500">Added by {ownerEmails[item.owner_id] ?? "Loading author…"}</span>
                </span>
                <ActionMenu
                  label={item.word}
                  actions={[
                    { label: "Edit", icon: <Pencil size={15} />, onSelect: () => void onEditWord(item) },
                    { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void onRemove("community_words", item), destructive: true },
                  ]}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
