import { useMemo } from "react";
import { BookOpen, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { CategoryIdentity } from "@/components/vocabulary/CategoryAvatar";
import type { PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
import { getPublishedCategoryFallbackImages } from "@/lib/admin-review-mapping";

export function AdminReviewPublishedLists({
  categories,
  words,
  ownerEmails,
  onRemove,
  onEditCategory,
  onEditWord,
}: {
  categories: PublishedCategory[];
  words: PublishedWord[];
  ownerEmails: Record<string, string>;
  onRemove: (table: "community_categories" | "community_words", item: PublishedCategory | PublishedWord) => void | Promise<void>;
  onEditCategory: (category: PublishedCategory) => void | Promise<void>;
  onEditWord: (word: PublishedWord) => void | Promise<void>;
}) {
  const fallbackImagesByCategory = useMemo(
    () => getPublishedCategoryFallbackImages(words),
    [words],
  );

  return (
    <div className="admin-review-published-lists mt-5 grid gap-4 lg:grid-cols-2">
      <div className="admin-review-published-list">
        <h3><FolderOpen size={18} /> Categories</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          {categories.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <CategoryIdentity
                name={item.name}
                imagePath={item.image_path}
                fallbackWordImagePath={fallbackImagesByCategory.get(item.id)}
                author={ownerEmails[item.owner_id] ?? "Loading author…"}
              />
              <ActionMenu label={item.name} actions={[
                { label: "Edit", icon: <Pencil size={15} />, onSelect: () => void onEditCategory(item) },
                { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void onRemove("community_categories", item), destructive: true },
              ]} />
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
              <ActionMenu label={item.word} actions={[
                { label: "Edit", icon: <Pencil size={15} />, onSelect: () => void onEditWord(item) },
                { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => void onRemove("community_words", item), destructive: true },
              ]} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
