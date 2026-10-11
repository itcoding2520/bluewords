import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/Card";
import type { VocabularyWord } from "@/data/vocabulary";

import { WordRow } from "./WordRow";

interface RecentWordsProps {
  words: VocabularyWord[];
}

export function RecentWords({ words }: RecentWordsProps) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Recently added
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Your latest vocabulary.
          </p>
        </div>

        <Link
          href="/vocabulary"
          className="flex items-center gap-1 text-sm font-medium text-blue-600"
        >
          View all
          <ArrowRight size={15} />
        </Link>
      </div>

      <Card className="mt-4 overflow-hidden">
        {words?.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">
            No words yet. Add your first word!
          </p>
        ) : (
          words?.map((item) => (
            <WordRow
              key={item.id}
              word={item.word}
              meaning={item.meaning}
              category={item.category}
            />
          ))
        )}
      </Card>
    </section>
  );
}