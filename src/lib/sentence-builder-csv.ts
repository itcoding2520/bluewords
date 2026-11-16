import { escapeCsvCell, parseCsvRows } from "@/lib/csv-rows";
import { parsePipeSeparatedValues } from "@/lib/sentence-builder";
import type {
  SentenceBuilderQuestion,
  SentenceDifficulty,
  SentenceQuestionInput,
} from "@/lib/sentence-builder";

export function parseSentenceBuilderCsv(csv: string): SentenceQuestionInput[] {
  const rows = parseCsvRows(csv, {
    unclosedQuote: "CSV contains an unclosed quoted field.",
    missingContent: "CSV needs a header and at least one question.",
  });
  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  const index = (name: string) => headers.indexOf(name);
  const required = ["question_id", "level", "category", "prompt_vi", "answer_sentence", "answer_tokens_json", "distractor_tokens_json", "image_keyword", "vocabulary_words"];
  const missing = required.filter((header) => index(header) < 0);
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(", ")}`);
  return rows.slice(1).map((cells, rowIndex) => {
    const value = (name: string) => (cells[index(name)] ?? "").trim();
    const level = value("level").toLocaleLowerCase();
    const difficulty = ({ "1": "easy", "2": "medium", "3": "hard", easy: "easy", medium: "medium", hard: "hard" } as Record<string, SentenceDifficulty>)[level];
    if (!difficulty) throw new Error(`Row ${rowIndex + 2}: level must be 1, 2, 3, easy, medium, or hard.`);
    let answerTokens: unknown;
    let distractorTokens: unknown;
    try { answerTokens = JSON.parse(value("answer_tokens_json")); distractorTokens = JSON.parse(value("distractor_tokens_json") || "[]"); }
    catch { throw new Error(`Row ${rowIndex + 2}: answer and distractor tokens must be valid JSON arrays.`); }
    if (!Array.isArray(answerTokens) || answerTokens.length < 2 || answerTokens.some((token) => typeof token !== "string") || !Array.isArray(distractorTokens) || distractorTokens.some((token) => typeof token !== "string")) {
      throw new Error(`Row ${rowIndex + 2}: token fields must be arrays of words.`);
    }
    const item: SentenceQuestionInput = {
      question_id: value("question_id"), difficulty, category: value("category"), prompt_vi: value("prompt_vi"),
      answer_sentence: value("answer_sentence"), answer_tokens: answerTokens as string[], distractor_tokens: distractorTokens as string[],
      image_keyword: value("image_keyword"), vocabulary_words: parsePipeSeparatedValues(value("vocabulary_words")), is_active: true,
    };
    if (!item.question_id || !item.category || !item.prompt_vi || !item.answer_sentence) throw new Error(`Row ${rowIndex + 2}: question ID, category, hint, and answer are required.`);
    return item;
  });
}

export function exportSentenceBuilderCsv(questions: SentenceBuilderQuestion[]) {
  const header = ["question_id", "level", "category", "prompt_vi", "answer_sentence", "answer_tokens_json", "distractor_tokens_json", "image_keyword", "vocabulary_words"];
  const level: Record<SentenceDifficulty, string> = { easy: "1", medium: "2", hard: "3" };
  const lines = questions.map((question) => [question.question_id, level[question.difficulty], question.category, question.prompt_vi,
    question.answer_sentence, JSON.stringify(question.answer_tokens), JSON.stringify(question.distractor_tokens), question.image_keyword,
    question.vocabulary_words.join("|")].map((value) => escapeCsvCell(value)).join(","));
  return [header.map((value) => escapeCsvCell(value)).join(","), ...lines].join("\r\n");
}
