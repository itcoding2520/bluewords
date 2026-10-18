"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Circle } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";

interface Flashcard {
  word: VocabularyWord;
}

let currentShuffleSeed = 0;
let initializedShuffleSeed = false;
const shuffleSeedListeners = new Set<() => void>();

function subscribeToShuffleSeed(listener: () => void) {
  shuffleSeedListeners.add(listener);

  if (!initializedShuffleSeed) {
    initializedShuffleSeed = true;
    queueMicrotask(() => {
      currentShuffleSeed = Math.floor(Math.random() * 2 ** 32);
      shuffleSeedListeners.forEach((notify) => notify());
    });
  }

  return () => shuffleSeedListeners.delete(listener);
}

function getShuffleSeed() {
  return currentShuffleSeed;
}

function shuffleDeck(deck: Flashcard[], seed: number) {
  const shuffled = [...deck];
  let state = seed || 1;

  function random() {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

function buildDeck(words: VocabularyWord[]): Flashcard[] {
  return words.map((word) => ({ word }));
}

function FlashcardWord({
  card,
  showImage,
  children,
}: {
  card: Flashcard;
  showImage: boolean;
  children?: ReactNode;
}) {
  const imageUrl = useVocabularyImageUrl(card.word.imagePath);

  return (
    <div className="flex w-full flex-col items-center text-center lg:flex-row lg:justify-center lg:gap-8 lg:text-left">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Illustration for ${card.word.word}`}
          width={176}
          height={176}
          unoptimized
          className={`mb-5 size-36 rounded-2xl border border-slate-100 object-cover sm:size-44 lg:mb-0 lg:size-52 ${showImage ? "" : "hidden lg:block"}`}
        />
      )}

      <div className="flex min-w-0 flex-col items-center lg:items-start">
        <div className="flex items-center gap-2">
          <h2 className="break-words text-2xl font-bold text-slate-950 sm:text-3xl">
            {card.word.word}
          </h2>
          <PronunciationButton word={card.word.word} />
        </div>

        {card.word.ipa?.trim() && (
          <p className="mt-2 text-sm text-slate-500">/{card.word.ipa.trim()}/</p>
        )}
        {children}
      </div>
    </div>
  );
}

function FlashcardAnswer({ card }: { card: Flashcard }) {
  const detailedMeanings =
    card.word.detailedMeanings?.filter((meaning) => meaning.meaning.trim()) ??
    [];

  return (
    <div className="flex w-full flex-col items-center justify-center text-center">
      <FlashcardWord card={card} showImage={false}>
      {detailedMeanings.length > 0 ? (
        <ul className="mt-5 space-y-3 text-left">
          {detailedMeanings.map((meaning, index) => (
            <li
              key={meaning.id ?? `${meaning.partOfSpeech}-${index}`}
              className="flex items-start gap-2 text-slate-600"
            >
              <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium capitalize text-blue-700">
                {meaning.partOfSpeech}
              </span>
              <span>{meaning.meaning}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
          {card.word.meaning || "No meaning added yet."}
        </p>
      )}
      </FlashcardWord>
    </div>
  );
}

export function FlashcardsContent() {
  const { words, categories, isLoaded, toggleMastered } = useVocabulary();
  const shuffleSeed = useSyncExternalStore(
    subscribeToShuffleSeed,
    getShuffleSeed,
    () => 0
  );
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<VocabularyStatus>("learning");
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const statusCounts = useMemo(() => {
    const categoryWords = words.filter(
      (word) => category === "all" || word.category === category
    );

    return {
      learning: categoryWords.filter((word) => word.status === "learning").length,
      mastered: categoryWords.filter((word) => word.status === "mastered").length,
    };
  }, [category, words]);

  const deck = useMemo(() => {
    const filteredWords = words.filter(
      (word) =>
        word.status === status &&
        (category === "all" || word.category === category)
    );
    return shuffleDeck(buildDeck(filteredWords), shuffleSeed);
  }, [category, shuffleSeed, status, words]);

  const card = deck.length > 0 ? deck[index % deck.length] : undefined;

  function changeCategory(value: string) {
    setCategory(value);
    setIndex(0);
    setIsRevealed(false);
  }

  function changeStatus(value: VocabularyStatus) {
    setStatus(value);
    setIndex(0);
    setIsRevealed(false);
  }

  function moveCard(offset: number) {
    setIndex((current) => (current + offset + deck.length) % deck.length);
    setIsRevealed(false);
  }

  async function handleToggleStatus() {
    if (!card || isTogglingStatus) return;

    setIsTogglingStatus(true);
    try {
      const updated = await toggleMastered(card.word.id);
      if (updated) setIsRevealed(false);
    } finally {
      setIsTogglingStatus(false);
    }
  }

  if (!isLoaded) {
    return <p className="py-16 text-sm text-slate-500">Loading flashcards...</p>;
  }

  return (
    <div>
      <header className="mb-7">
        <p className="text-sm font-medium text-blue-600">Daily learning</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
          Flashcards
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Practice your vocabulary in a random order.
        </p>
      </header>

      <div className="mb-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="text-sm font-medium text-slate-600">
          Category
          <Select
            value={category}
            onChange={(event) => changeCategory(event.target.value)}
            className="mt-2"
          >
            <option value="all">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </Select>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-600">
            Vocabulary status
          </legend>
          <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              aria-pressed={status === "learning"}
              onClick={() => changeStatus("learning")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                status === "learning"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>Learning</span>
              <span
                className={`rounded-full  px-2 py-0.5 text-xs ${
                  status === "learning"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {statusCounts.learning}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={status === "mastered"}
              onClick={() => changeStatus("mastered")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                status === "mastered"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>Mastered</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  status === "mastered"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {statusCounts.mastered}
              </span>
            </button>
          </div>
        </fieldset>
      </div>

      {card ? (
        <>
          <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
            <span aria-live="polite">
              Card {index + 1} of {deck.length}
            </span>
            <span>{category === "all" ? "All categories" : category}</span>
          </div>

          <Card className="h-[420px] overflow-hidden p-0 sm:h-[480px]">
            <div className="[perspective:1200px] h-full w-full">
              <div
                className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none"
                style={{
                  transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <section
                  aria-label="Flashcard front"
                  aria-hidden={isRevealed}
                  inert={isRevealed}
                  className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 py-6 text-center [backface-visibility:hidden] sm:px-8 sm:py-8"
                >
                  <div className="flex w-full flex-1 flex-col items-center justify-center">
                    <FlashcardWord card={card} showImage />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsRevealed(true)}
                    className="mt-3 min-w-36 shrink-0"
                  >
                    Show meaning
                  </Button>
                </section>

                <section
                  aria-label="Flashcard answer"
                  aria-hidden={!isRevealed}
                  inert={!isRevealed}
                  className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 py-6 text-center [backface-visibility:hidden] sm:px-8 sm:py-8"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="flex w-full flex-1 flex-col items-center justify-center">
                    <FlashcardAnswer card={card} />
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsRevealed(false)}
                    className="mt-3 min-w-36 shrink-0"
                  >
                    Show word
                  </Button>
                </section>
              </div>
            </div>
          </Card>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              onClick={() => moveCard(-1)}
              disabled={deck.length < 2}
              aria-label="Previous flashcard"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleToggleStatus()}
              disabled={isTogglingStatus}
              aria-label={`Mark ${card.word.word} as ${status === "learning" ? "mastered" : "learning"}`}
              className={
                status === "learning"
                  ? "text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              }
            >
              {status === "learning" ? <Circle size={15} /> : <Check size={15} />}
              <span className="hidden sm:inline">
                {isTogglingStatus
                  ? "Saving..."
                  : status === "learning"
                    ? "Learning"
                    : "Mastered"}
              </span>
            </Button>
            <Button
              onClick={() => moveCard(1)}
              disabled={deck.length < 2}
              aria-label="Next flashcard"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </>
      ) : (
        <Card className="px-6 py-16 text-center">
          <h2 className="font-semibold text-slate-900">No flashcards yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Add vocabulary or choose a category with words to start studying.
          </p>
        </Card>
      )}
    </div>
  );
}
