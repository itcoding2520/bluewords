import { Pencil, Trash2 } from "lucide-react";

import { ActionMenu } from "@/components/ui/ActionMenu";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { AdminCategoryWordsList } from "@/components/admin/AdminCategoryWordsList";
import { formatShortDate } from "@/lib/formatDate";
import type { CategoryTab, CommunityCategory, CommunityWord } from "@/lib/admin-category-data";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

type AdminCategory = VocabularyCategoryRow | CommunityCategory;

interface AdminCategoryDetailPanelProps {
  activeTab: CategoryTab;
  selectedCategory: AdminCategory | null;
  selectedSharedCategory: CommunityCategory | null;
  selectedFallbackImage: string | null;
  emails: Record<string, string>;
  defaultWords: VocabularyWord[];
  words: CommunityWord[];
  wordEmails: Record<string, string>;
  wordsLoading: boolean;
  onEditCategory: (category: CommunityCategory) => void;
  onRemoveCategory: (category: CommunityCategory) => void;
  onEditWord: (word: CommunityWord) => void;
  onRemoveWord: (word: CommunityWord) => void;
}

export function AdminCategoryDetailPanel({
  activeTab,
  selectedCategory,
  selectedSharedCategory,
  selectedFallbackImage,
  emails,
  defaultWords,
  words,
  wordEmails,
  wordsLoading,
  onEditCategory,
  onRemoveCategory,
  onEditWord,
  onRemoveWord,
}: AdminCategoryDetailPanelProps) {
  return (
    <section className="admin-category-detail min-h-72 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      {!selectedCategory ? (
        <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">
          Choose a category to see its words.
        </div>
      ) : (
        <>
          <div className="admin-category-detail-header flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex min-w-0 items-center gap-3">
              <CategoryAvatar
                name={selectedCategory.name}
                imagePath={selectedSharedCategory?.image_path}
                fallbackWordImagePath={selectedFallbackImage}
                sizeClass="size-12"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {activeTab === "default" ? "Default category" : activeTab === "pending" ? "Waiting publish" : "Published custom category"}
                </p>
                <h2 className="mt-1 break-words text-xl font-bold text-slate-950">{selectedCategory.name}</h2>
                {selectedSharedCategory && (
                  <p className="mt-1 break-all text-sm text-slate-500">
                    Created by {emails[selectedSharedCategory.owner_id] ?? "Loading owner…"}
                  </p>
                )}
              </div>
            </div>

            {activeTab !== "default" && "created_at" in selectedCategory && (
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                Created {formatShortDate(selectedCategory.created_at, "Date unavailable")}
              </span>
            )}
            {selectedSharedCategory && (
              <ActionMenu
                label={selectedSharedCategory.name}
                actions={[
                  { label: "Edit", icon: <Pencil size={15} />, onSelect: () => onEditCategory(selectedSharedCategory) },
                  { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => onRemoveCategory(selectedSharedCategory), destructive: true },
                ]}
              />
            )}
          </div>

          <AdminCategoryWordsList
            activeTab={activeTab}
            defaultWords={defaultWords}
            words={words}
            wordEmails={wordEmails}
            wordsLoading={wordsLoading}
            onEditWord={onEditWord}
            onRemoveWord={onRemoveWord}
          />
        </>
      )}
    </section>
  );
}
