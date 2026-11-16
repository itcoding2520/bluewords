import type { VocabularyWord } from "@/data/vocabulary";
import { escapeCsvCell } from "@/lib/csv-rows";
import { VOCABULARY_CSV_HEADERS } from "@/lib/vocabulary-csv-shared";

export function exportVocabularyCsv(words: VocabularyWord[]): string {
  const rows: string[][] = [
    [...VOCABULARY_CSV_HEADERS],
  ];

  for (const word of words) {
    // RPC and older stored records may contain incomplete meaning objects.
    // Skip malformed details and fall back to the word's legacy meaning.
    const meanings = Array.isArray(word.detailedMeanings)
      ? word.detailedMeanings.filter(
          (item) => typeof item?.meaning === "string" && item.meaning.trim().length > 0
        )
      : [];

    if (meanings.length) {
      for (const item of meanings) {
        rows.push([
          word.word,
          word.type ?? "word",
          word.meaning,
          typeof item.partOfSpeech === "string" ? item.partOfSpeech : "",
          item.meaning,
          word.category,
          word.status,
          word.ipa ?? "",
        ]);
      }
    } else {
      rows.push([
        word.word,
        word.type ?? "word",
        word.meaning,
        "",
        "",
        word.category,
        word.status,
        word.ipa ?? "",
      ]);
    }
  }

  return `\uFEFF${rows.map((row) => row.map((value) => escapeCsvCell(value, {
    spreadsheetSafe: true,
    quoteAll: false,
  })).join(",")).join("\r\n")}`;
}
