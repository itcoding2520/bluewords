import { ArrowRight, Heart, Map, Sparkles, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { WORD_MAZE_LIVES, WORD_MAZE_QUESTION_COUNT } from "@/lib/word-maze";

export function WordMazeSetup({
  category, categories, words, candidateCount, onCategoryChange, onStart,
}: {
  category: string;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  candidateCount: number;
  onCategoryChange: (category: string) => void;
  onStart: () => void;
}) {
  return (
    <div className="word-maze-setup">
      <Card className="word-maze-setup-card">
        <div className="word-maze-setup-icon"><Map size={28} /></div>
        <div className="word-maze-setup-copy"><h2>Ready for an adventure?</h2><p>Answer {WORD_MAZE_QUESTION_COUNT} meaning questions to open the path. You have three lives for the journey.</p></div>
        <label htmlFor="word-maze-category">Choose a category</label>
        <CategoryDropdown id="word-maze-category" ariaLabel="Word Maze category" className="word-maze-category-select" category={category} categories={categories} words={words} onChange={onCategoryChange} includeAll fullWidth />
        <p className="word-maze-availability">{candidateCount} words ready for the maze</p>
        {candidateCount < WORD_MAZE_QUESTION_COUNT && <p className="word-maze-warning" role="status">Add at least {WORD_MAZE_QUESTION_COUNT} words with different meanings to start this adventure.</p>}
        <button type="button" className="word-maze-primary" disabled={candidateCount < WORD_MAZE_QUESTION_COUNT} onClick={onStart}><Map size={20} /> Start adventure <ArrowRight size={20} /></button>
      </Card>
      <Card className="word-maze-howto"><span className="word-maze-howto-icon"><Sparkles size={24} /></span><h2>How to play</h2><p>Choose the correct meaning to move your mascot along the glowing path. A wrong answer costs one life, but you can try the question again.</p><div className="word-maze-howto-stats"><span><Star size={18} fill="currentColor" /> +10 <small>points</small></span><span><Heart size={18} fill="currentColor" /> {WORD_MAZE_LIVES} <small>lives</small></span></div></Card>
    </div>
  );
}
