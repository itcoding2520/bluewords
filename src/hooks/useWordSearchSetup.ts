import { useState } from "react";
import type { Difficulty, GridSize } from "@/lib/word-search-config";

export function useWordSearchSetup() {
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  return {
    gridSize,
    setGridSize,
    difficulty,
    setDifficulty,
    category,
    setCategory,
    categoriesExpanded,
    toggleCategoriesExpanded: () => setCategoriesExpanded((expanded) => !expanded),
  };
}
