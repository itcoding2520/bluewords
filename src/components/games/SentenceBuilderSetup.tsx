import { ArrowRight, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { sentenceBuilderQuestionCounts } from "@/hooks/useSentenceBuilderController";
import type { SentenceDifficulty } from "@/lib/sentence-builder";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

export function SentenceBuilderSetup({
  difficulty,
  onDifficultyChange,
  category,
  onCategoryChange,
  categories,
  words,
  questionCount,
  onQuestionCountChange,
  eligibleCount,
  onStart,
}: {
  difficulty: SentenceDifficulty;
  onDifficultyChange: (difficulty: SentenceDifficulty) => void;
  category: string;
  onCategoryChange: (category: string) => void;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  questionCount: 5 | 10;
  onQuestionCountChange: (count: 5 | 10) => void;
  eligibleCount: number;
  onStart: () => void;
}) {
  return (
    <div className="sentence-builder-setup">
      <Card className="sentence-builder-panel">
        <div className="sentence-builder-panel-title"><span>🧩</span><div><h2>Build a sentence</h2><p>Use the picture and Vietnamese clue to arrange the word tiles.</p></div></div>
        <label htmlFor="sentence-builder-difficulty">Difficulty</label>
        <select id="sentence-builder-difficulty" className="sentence-builder-difficulty-select" value={difficulty} onChange={(event) => { onDifficultyChange(event.target.value as SentenceDifficulty); onCategoryChange("all"); }}>
          <option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option>
        </select>
        <label className="sentence-builder-category-label" htmlFor="sentence-builder-category">Category</label>
        <CategoryDropdown id="sentence-builder-category" ariaLabel="Sentence category" category={category} categories={categories} words={words} onChange={onCategoryChange} includeAll fullWidth />
        <fieldset>
          <legend>Questions per round</legend>
          <div className="sentence-builder-counts">
            {sentenceBuilderQuestionCounts.map((count) => <button key={count} type="button" aria-pressed={count === questionCount} disabled={eligibleCount < count} className={count === questionCount ? "is-selected" : ""} onClick={() => onQuestionCountChange(count)}>{count} questions</button>)}
          </div>
        </fieldset>
        <p className="sentence-builder-availability">{eligibleCount} questions available at this level.</p>
        {eligibleCount < 5 && <p className="sentence-builder-empty">There are not enough active questions here yet. Try another level or category.</p>}
        <button className="sentence-builder-primary" type="button" disabled={eligibleCount < questionCount} onClick={onStart}><Sparkles size={19}/> Start game <ArrowRight size={19}/></button>
      </Card>
      <Card className="sentence-builder-howto"><span>💡</span><h2>How to play</h2><p>Tap each word tile in sentence order, then check your sentence. Correct answers earn 10 points. Hints reveal one word.</p><strong><Star size={17} fill="currentColor"/> 10 points per correct sentence</strong></Card>
    </div>
  );
}
