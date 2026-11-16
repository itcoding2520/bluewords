import { isVocabularyType, VOCABULARY_TYPES, type VocabularyType } from "@/config/vocabulary";
import { Select } from "@/components/ui/Select";

export function VocabularyWordTypeField({
  value,
  onChange,
}: {
  value: VocabularyType;
  onChange: (value: VocabularyType) => void;
}) {
  return (
    <div>
      <label htmlFor="type" className="text-sm font-medium text-slate-700">
        Type
      </label>
      <Select
        id="type"
        value={value}
        onChange={(event) => {
          if (isVocabularyType(event.target.value)) onChange(event.target.value);
        }}
        containerClassName="mt-2"
      >
        {VOCABULARY_TYPES.map((vocabularyType) => (
          <option key={vocabularyType} value={vocabularyType}>
            {vocabularyType === "word" ? "Word" : "Expression"}
          </option>
        ))}
      </Select>
    </div>
  );
}
