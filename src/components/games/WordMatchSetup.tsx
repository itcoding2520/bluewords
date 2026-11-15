import { ArrowRight, Shuffle, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

type PairCount = 6 | 8 | 10;
const PAIR_COUNTS: PairCount[] = [6, 8, 10];

export function WordMatchSetup({
  words,
  categories,
  category,
  onCategoryChange,
  pairCount,
  onPairCountChange,
  availablePairCount,
  onStart,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  onCategoryChange: (category: string) => void;
  pairCount: PairCount;
  onPairCountChange: (count: PairCount) => void;
  availablePairCount: number;
  onStart: () => void;
}) {
  return (
    <div className="word-match-setup-grid">
      <Card className="word-match-setup-card">
        <div className="word-match-section-heading">
          <span><Shuffle size={23} /></span>
          <div><h2>Set up your round</h2><p>Choose a category and how many pairs to find.</p></div>
        </div>
        <label className="word-match-label" htmlFor="word-match-category">Category</label>
        <CategoryDropdown
          id="word-match-category"
          ariaLabel="Word Match category"
          category={category}
          categories={categories}
          words={words}
          onChange={onCategoryChange}
          includeAll
          fullWidth
        />
        <fieldset className="word-match-count-fieldset">
          <legend>Number of pairs</legend>
          <div className="word-match-count-options">
            {PAIR_COUNTS.map((count) => (
              <button
                key={count}
                type="button"
                aria-pressed={pairCount === count}
                disabled={availablePairCount < count}
                onClick={() => onPairCountChange(count)}
                className={`word-match-count ${pairCount === count ? "is-selected" : ""}`}
              >
                {count} pairs
              </button>
            ))}
          </div>
          <p>{availablePairCount} pairs available. Words with pictures match to pictures; other words match to meanings.</p>
        </fieldset>
        {availablePairCount < 2 && (
          <p className="word-match-empty-note" role="status">
            Add at least two words with meanings to play this round.
          </p>
        )}
        <button
          type="button"
          onClick={onStart}
          disabled={availablePairCount < pairCount}
          className="word-match-start"
        >
          <Shuffle size={19} /> Start matching <ArrowRight size={19} />
        </button>
      </Card>
      <Card className="word-match-preview-card">
        <p className="word-match-eyebrow">HOW TO PLAY</p>
        <h2>Flip to find a match</h2>
        <p>Reveal two cards at a time. Match a word with its picture or meaning to score points.</p>
        <div className="word-match-preview-pair"><span>apple</span><ArrowRight size={18} /><span>🍎</span></div>
        <div className="word-match-preview-pair"><span>sun</span><ArrowRight size={18} /><span>mặt trời</span></div>
        <p className="word-match-preview-footnote"><Sparkles size={16} /> Each correct pair earns 10 points.</p>
      </Card>
    </div>
  );
}
