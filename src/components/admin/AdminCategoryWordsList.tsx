import Image from "next/image";
import { Pencil, Trash2 } from "lucide-react";

import { ActionMenu } from "@/components/ui/ActionMenu";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import type { CategoryTab, CommunityWord } from "@/lib/admin-category-data";
import type { VocabularyWord } from "@/data/vocabulary";

interface AdminCategoryWordsListProps {
  activeTab: CategoryTab;
  defaultWords: VocabularyWord[];
  words: CommunityWord[];
  wordEmails: Record<string, string>;
  wordsLoading: boolean;
  onEditWord: (word: CommunityWord) => void;
  onRemoveWord: (word: CommunityWord) => void;
}

export function AdminCategoryWordsList({
  activeTab,
  defaultWords,
  words,
  wordEmails,
  wordsLoading,
  onEditWord,
  onRemoveWord,
}: AdminCategoryWordsListProps) {
  return (
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
                <p className="mt-0.5 text-sm text-slate-500">
                  {word.meaning || "No meaning provided"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Added by {wordEmails[word.owner_id] ?? "Loading author…"}
                </p>
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
  );
}

function AdminWordThumbnail({
  word,
  imagePath,
}: {
  word: string;
  imagePath?: string | null;
}) {
  const imageUrl = useVocabularyImageUrl(imagePath);
  return imageUrl ? (
    <Image
      src={imageUrl}
      alt=""
      width={48}
      height={48}
      unoptimized
      className="admin-category-word-image"
    />
  ) : (
    <span
      className="admin-category-word-image admin-category-word-fallback"
      aria-hidden="true"
    >
      {word.slice(0, 1).toUpperCase()}
    </span>
  );
}
