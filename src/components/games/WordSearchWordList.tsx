import type { VocabularyWord } from "@/data/vocabulary";

type WordSearchWord = { id: string; word: string };

export function WordSearchWordList({
  words,
  vocabularyById,
  foundIds,
}: {
  words: WordSearchWord[];
  vocabularyById: Map<string, VocabularyWord>;
  foundIds: Set<string>;
}) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-2 md:mt-4 lg:grid-cols-1">
      {words.map((word) => {
        const vocabularyWord = vocabularyById.get(word.id);
        const meaning = vocabularyWord?.meaning?.trim() || vocabularyWord?.detailedMeanings?.find((item) => item.meaning.trim())?.meaning || "Meaning unavailable";
        const found = foundIds.has(word.id);
        return (
          <li key={word.id} className={`min-w-0 rounded-lg p-2 leading-4 md:px-3 ${found ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"}`}>
            <span className={`inline break-words text-sm font-semibold ${found ? "line-through" : ""}`}>{word.word}</span>
            <span className="inline break-words pl-1 text-xs leading-4 text-slate-500">({meaning})</span>
          </li>
        );
      })}
    </ul>
  );
}
