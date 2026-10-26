
import { Plus } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/Button";

interface VocabularyHeaderProps {
  onAddWord: () => void;
  onManageCategories: () => void;
  activeTab: "words" | "categories";
}

export function VocabularyHeader({
  onAddWord,
  onManageCategories,
  activeTab,
}: VocabularyHeaderProps) {
  return (
    <>
    <header className={`vocabulary-page-hero ${activeTab === "categories" ? "category-management-hero" : ""} flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between`}>
      <div className="min-w-0">
        <h1 className="page-title vocabulary-page-title mt-1 flex items-center gap-2">
          Vocabulary
          <Image src="/images/ui/icons/star.png" alt="" width={32} height={32} className="size-7 object-contain sm:size-8" />
        </h1>

        <p className="page-intro-description mt-2">
          Keep track of the words you&apos;re learning.
        </p>
      </div>

      {activeTab === "words" && <Button
          onClick={onAddWord}
          className="vocabulary-add-button w-full shrink-0 justify-center sm:w-auto"
        >
          <Plus size={17} />
          Add word
        </Button>}
    </header>
    <nav aria-label="Vocabulary sections" className="vocabulary-page-tabs mt-5 flex gap-6 border-b border-blue-100/80">
      <button type="button" aria-current={activeTab === "words" ? "page" : undefined} onClick={activeTab === "words" ? undefined : onManageCategories} className={`-mb-px border-b-2 px-2 pb-3 text-sm font-semibold ${activeTab === "words" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Words</button>
      <button type="button" aria-current={activeTab === "categories" ? "page" : undefined} onClick={activeTab === "categories" ? undefined : onManageCategories} className={`-mb-px border-b-2 px-2 pb-3 text-sm font-semibold ${activeTab === "categories" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Categories</button>
    </nav>
    </>
  );
}
