import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { PublishedCategory } from "@/lib/admin-review-types";

export function AdminReviewPublishedForms({
  categories,
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
}: {
  categories: PublishedCategory[];
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
}) {
  return (
    <>
      <form className="admin-review-category-form mt-4 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); void onAddCategory(); }}>
        <input value={newCategory} onChange={(event) => onNewCategoryChange(event.target.value)} placeholder="New category name" aria-label="New category name" className="min-w-48 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <Button type="submit"><Plus size={16} /> Add category</Button>
      </form>
      <form className="admin-review-word-form mt-3 grid gap-2 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void onAddWord(); }}>
        <Select value={newWordCategory} onChange={(event) => onNewWordCategoryChange(event.target.value)} aria-label="Word category" containerClassName="admin-review-category-select" className="admin-review-category-select-control">
          <option value="">Choose category</option>
          {categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </Select>
        <input value={newWord} onChange={(event) => onNewWordChange(event.target.value)} placeholder="English word" aria-label="English word" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <input value={newMeaning} onChange={(event) => onNewMeaningChange(event.target.value)} placeholder="Meaning" aria-label="Word meaning" className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
        <Button type="submit" disabled={!newWordCategory || !newWord.trim()}><Plus size={16} /> Add word</Button>
      </form>
    </>
  );
}
