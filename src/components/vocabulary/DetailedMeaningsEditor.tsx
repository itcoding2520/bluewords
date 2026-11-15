import { Plus, Trash2 } from "lucide-react";
import { PARTS_OF_SPEECH, type PartOfSpeech } from "@/config/vocabulary";
import type { VocabularyMeaning } from "@/data/vocabulary";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface DetailedMeaningsEditorProps {
  meanings: VocabularyMeaning[];
  onUpdate: (index: number, updates: Partial<VocabularyMeaning>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

export function DetailedMeaningsEditor({
  meanings,
  onUpdate,
  onAdd,
  onRemove,
}: DetailedMeaningsEditorProps) {
  return (
    <section aria-labelledby="detailed-meanings-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3
            id="detailed-meanings-heading"
            className="text-sm font-medium text-slate-700"
          >
            Detailed meanings
            <span className="ml-1 font-normal text-slate-400">(optional)</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Add meanings by part of speech.
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
        >
          <Plus size={16} />
          Add meaning
        </button>
      </div>

      {meanings.length > 0 && (
        <div className="mt-3 space-y-3">
          {meanings.map((item, index) => (
            <div
              key={item.id ?? `new-meaning-${index}`}
              className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]"
            >
              <div>
                <label
                  htmlFor={`meaning-part-${index}`}
                  className="text-xs font-medium text-slate-600"
                >
                  Part of speech
                </label>
                <Select
                  id={`meaning-part-${index}`}
                  value={item.partOfSpeech}
                  onChange={(event) =>
                    onUpdate(index, {
                      partOfSpeech: event.target.value as PartOfSpeech,
                    })
                  }
                  containerClassName="mt-1.5"
                >
                  {PARTS_OF_SPEECH.map((partOfSpeech) => (
                    <option key={partOfSpeech} value={partOfSpeech}>
                      {partOfSpeech.replace(/\b\w/g, (letter) =>
                        letter.toUpperCase()
                      )}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label
                  htmlFor={`meaning-detail-${index}`}
                  className="text-xs font-medium text-slate-600"
                >
                  Detailed meaning
                </label>
                <Input
                  id={`meaning-detail-${index}`}
                  value={item.meaning}
                  onChange={(event) =>
                    onUpdate(index, { meaning: event.target.value })
                  }
                  placeholder="Enter this meaning"
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-end justify-end">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  aria-label={`Remove detailed meaning ${index + 1}`}
                  className="flex size-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
