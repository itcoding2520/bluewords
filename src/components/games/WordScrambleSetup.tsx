import { ArrowRight, CaseSensitive, Lightbulb, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

const QUESTION_COUNTS = [5, 10] as const;
type QuestionCount = (typeof QUESTION_COUNTS)[number];

export function WordScrambleSetup({
  words,
  categories,
  category,
  onCategoryChange,
  questionCount,
  onQuestionCountChange,
  candidateCount,
  onStart,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  onCategoryChange: (category: string) => void;
  questionCount: QuestionCount;
  onQuestionCountChange: (count: QuestionCount) => void;
  candidateCount: number;
  onStart: () => void;
}) {
  return (
    <div className="word-scramble-setup">
      <Card className="word-scramble-panel">
        <div className="word-scramble-section-title">
          <span><CaseSensitive size={25} /></span>
          <div>
            <h2>Ready to unscramble?</h2>
            <p>Use the picture and meaning clues to spell each vocabulary word.</p>
          </div>
        </div>
        <label htmlFor="word-scramble-category">Category</label>
        <CategoryDropdown
          id="word-scramble-category"
          ariaLabel="Word Scramble category"
          category={category}
          categories={categories}
          words={words}
          onChange={onCategoryChange}
          includeAll
          fullWidth
        />
        <fieldset>
          <legend>Questions per round</legend>
          <div className="word-scramble-counts">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={questionCount === count}
                disabled={candidateCount < count}
                onClick={() => onQuestionCountChange(count)}
                className={questionCount === count ? "is-selected" : ""}
              >
                {count} questions
              </button>
            ))}
          </div>
          <p>{candidateCount} words available. Words must have 3–10 letters.</p>
        </fieldset>
        {candidateCount < 5 && (
          <p className="word-scramble-empty" role="status">
            Add at least five eligible words to play Word Scramble.
          </p>
        )}
        <button
          type="button"
          className="word-scramble-primary"
          disabled={candidateCount < questionCount}
          onClick={onStart}
        >
          <CaseSensitive size={20} /> Start game <ArrowRight size={19} />
        </button>
      </Card>
      <Card className="word-scramble-howto">
        <span><Lightbulb size={22} /></span>
        <h2>How to play</h2>
        <p>Tap the letter tiles to spell the answer. Use a hint if you get stuck. Correct answers build your streak.</p>
        <div className="word-scramble-example"><b>B</b><b>A</b><b>N</b><b>A</b><b>N</b><b>A</b></div>
        <small><Star size={14} fill="currentColor" /> 20 points per answer, or 10 with a hint.</small>
      </Card>
    </div>
  );
}
