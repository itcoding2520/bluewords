import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { CategoryIdentity } from "@/components/vocabulary/CategoryAvatar";
import { Select } from "@/components/ui/Select";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

interface VocabularyWordCategoryFieldProps {
  category: string;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  onChange: (category: string) => void;
}

export function VocabularyWordCategoryField({
  category,
  categories,
  words,
  onChange,
}: VocabularyWordCategoryFieldProps) {
  const selectedCategory = categories.find((item) => item.name === category);
  const fallbackWordImagePath = words.find((item) =>
    normalizeVocabularyLabel(item.category) === normalizeVocabularyLabel(category)
    && item.imagePath
  )?.imagePath;

  return (
    <div>
      <label htmlFor="category" className="text-sm font-medium text-slate-700">
        <span className="mb-2 block">Category</span>
        {selectedCategory && (
          <CategoryIdentity
            name={category}
            imagePath={selectedCategory.image_path}
            fallbackWordImagePath={fallbackWordImagePath}
          />
        )}
      </label>

      <Select
        id="category"
        value={category}
        onChange={(event) => onChange(event.target.value)}
        containerClassName="mt-2"
      >
        {categories.map((categoryOption) => (
          <option key={categoryOption.id} value={categoryOption.name}>
            {categoryOption.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
