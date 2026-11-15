import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

import { ActionMenu } from "@/components/ui/ActionMenu";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
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

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-slate-800">
              Words ({activeTab === "default" ? defaultWords.length : words.length})
            </h3>
            {wordsLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading words…</p>
            ) : (activeTab === "default" ? defaultWords.length + words.length : words.length) === 0 ? (
              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                This category has no words yet.
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {activeTab === "default" && defaultWords.map((word) => (
                  <li key={word.id} className="admin-category-word-row">
                    <AdminWordThumbnail word={word.word} imagePath={word.imagePath} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{word.word}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{word.meaning}</p>
                    </div>
                    <span className="admin-category-word-status">Default</span>
                  </li>
                ))}
                {words.map((word) => (
                  <li key={word.id} className="admin-category-word-row">
                    <AdminWordThumbnail word={word.word} imagePath={word.image_path} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{word.word}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{word.meaning || "No meaning provided"}</p>
                      <p className="mt-1 text-xs text-slate-500">Added by {wordEmails[word.owner_id] ?? "Loading author…"}</p>
                    </div>
                    <span className={`admin-category-word-status ${word.status === "pending" ? "is-pending" : ""}`}>
                      {activeTab === "default" ? "Custom · Published" : word.status === "pending" ? "Waiting publish" : word.status}
                    </span>
                    <ActionMenu
                      label={word.word}
                      actions={[
                        { label: "Edit", icon: <Pencil size={15} />, onSelect: () => onEditWord(word) },
                        { label: "Remove", icon: <Trash2 size={15} />, onSelect: () => onRemoveWord(word), destructive: true },
                      ]}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function AdminWordThumbnail({ word, imagePath }: { word: string; imagePath?: string | null }) {
  const imageUrl = useVocabularyImageUrl(imagePath);
  return imageUrl
    ? <Image src={imageUrl} alt="" width={48} height={48} unoptimized className="admin-category-word-image" />
    : <span className="admin-category-word-image admin-category-word-fallback" aria-hidden="true">{word.slice(0, 1).toUpperCase()}</span>;
}
