import type { Dispatch, SetStateAction } from "react";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { WordFormErrors } from "@/hooks/useWordFormController";

interface VocabularyWordTextFieldsProps {
  word: string;
  setWord: Dispatch<SetStateAction<string>>;
  meaning: string;
  setMeaning: Dispatch<SetStateAction<string>>;
  errors: WordFormErrors;
  clearError: (field: keyof WordFormErrors) => void;
}

export function VocabularyWordTextFields({
  word,
  setWord,
  meaning,
  setMeaning,
  errors,
  clearError,
}: VocabularyWordTextFieldsProps) {
  return (
    <>
      <div>
        <label htmlFor="word" className="text-sm font-medium text-slate-700">
          Word or expression
        </label>
        <Input
          id="word"
          value={word}
          onChange={(event) => {
            setWord(event.target.value);
            if (errors.word) clearError("word");
          }}
          placeholder="e.g. resilient"
          error={Boolean(errors.word)}
          className="mt-2"
        />
        {errors.word && (
          <AutoDismissMessage key={errors.word} variant="error" className="mt-1.5 bg-transparent p-0 text-xs font-medium text-red-500">
            {errors.word}
          </AutoDismissMessage>
        )}
      </div>

      <div>
        <label htmlFor="meaning" className="text-sm font-medium text-slate-700">
          Meaning
        </label>
        <textarea
          id="meaning"
          aria-invalid={Boolean(errors.meaning)}
          aria-describedby={errors.meaning ? "meaning-error" : undefined}
          value={meaning}
          onChange={(event) => {
            setMeaning(event.target.value);
            if (errors.meaning) clearError("meaning");
          }}
          placeholder="What does this word mean?"
          rows={3}
          className={cn(
            "mt-2 w-full resize-none rounded-xl border px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 sm:text-sm",
            errors.meaning
              ? "border-red-300 focus:border-red-400 focus:ring-red-50"
              : "border-slate-200 focus:border-blue-400 focus:ring-blue-50"
          )}
        />
        {errors.meaning && (
          <AutoDismissMessage
            key={errors.meaning}
            id="meaning-error"
            variant="error"
            className="mt-1.5 bg-transparent p-0 text-xs font-medium text-red-500"
          >
            {errors.meaning}
          </AutoDismissMessage>
        )}
      </div>
    </>
  );
}
