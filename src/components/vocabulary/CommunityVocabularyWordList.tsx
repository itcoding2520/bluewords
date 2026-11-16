import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import type { CommunityWord } from "@/lib/supabase/community-vocabulary";

export function CommunityVocabularyWordList({
  loaded,
  visibleWords,
  fallbackWordImages,
}: {
  loaded: boolean;
  visibleWords: CommunityWord[];
  fallbackWordImages: Map<string, string>;
}) {
  if (!loaded) return <p className="py-6 text-sm text-slate-500">Loading community vocabulary…</p>;
  if (visibleWords.length === 0) return <p className="py-6 text-sm text-slate-500">No matching published words.</p>;

  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {visibleWords.map((item) => (
        <li key={item.id} className="rounded-xl border border-indigo-100 bg-white p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-slate-900">{item.word}</span>
            <CategoryAvatar
              name={item.community_categories.name}
              imagePath={item.community_categories.image_path}
              fallbackWordImagePath={fallbackWordImages.get(item.community_categories.name)}
            />
          </div>
          <p className="mt-1 text-xs font-medium text-indigo-700">{item.community_categories.name}</p>
          <p className="mt-1 text-sm text-slate-600">{item.meaning}</p>
          {item.ipa && <p className="mt-1 text-xs text-slate-400">{item.ipa}</p>}
        </li>
      ))}
    </ul>
  );
}
