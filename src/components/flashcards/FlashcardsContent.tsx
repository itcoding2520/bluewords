"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CalendarClock, Check, Circle, Star } from "lucide-react";
import { toast } from "sonner";

import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import {
  getVocabularyReviewSchedules,
  recordVocabularyReview,
} from "@/lib/supabase/reviews";
import type { VocabularyReviewScheduleRow } from "@/types/database";

interface Flashcard {
  word: VocabularyWord;
}

let currentReviewTime = 0;
let reviewClockInterval: ReturnType<typeof setInterval> | null = null;
const reviewClockListeners = new Set<() => void>();

function subscribeToReviewClock(listener: () => void) {
  reviewClockListeners.add(listener);

  if (!reviewClockInterval) {
    const updateTime = () => {
      currentReviewTime = Date.now();
      reviewClockListeners.forEach((notify) => notify());
    };

    queueMicrotask(updateTime);
    reviewClockInterval = setInterval(updateTime, 60_000);
  }

  return () => {
    reviewClockListeners.delete(listener);
    if (reviewClockListeners.size === 0 && reviewClockInterval) {
      clearInterval(reviewClockInterval);
      reviewClockInterval = null;
    }
  };
}

function getReviewClockSnapshot() {
  return currentReviewTime;
}

let currentShuffleSeed = 0;
const shuffleSeedListeners = new Set<() => void>();

function subscribeToShuffleSeed(listener: () => void) {
  shuffleSeedListeners.add(listener);

  if (shuffleSeedListeners.size === 1) {
    queueMicrotask(() => {
      currentShuffleSeed = Math.floor(Math.random() * 2 ** 32);
      shuffleSeedListeners.forEach((notify) => notify());
    });
  }

  return () => {
    shuffleSeedListeners.delete(listener);
  };
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
  const signedImageUrl = useVocabularyImageUrl(card.word.imagePath);
  const imageUrl = card.word.imageUrl ?? signedImageUrl;

  return (
    <div className="flashcard-word-content flex w-full flex-col items-center justify-center text-center">
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={`Illustration for ${card.word.word}`}
          width={176}
          height={176}
          unoptimized
          className={`flashcard-word-image mb-5 size-36 rounded-2xl border border-slate-100 object-cover sm:size-44 ${showImage ? "" : "hidden sm:block"}`}
        />
      )}

      <div className="flex min-w-0 flex-col items-center">
        <div className="flex items-center gap-2">
          <h2 className="break-words text-2xl font-bold text-slate-950 sm:text-3xl">
            {card.word.word}
          </h2>
          <PronunciationButton word={card.word.word} />
        </div>

        {card.word.ipa?.trim() && (
          <p className="mt-2 text-sm text-slate-500">{card.word.ipa.trim()}</p>
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
  const { words, categories, isLoaded, isAuthenticated, toggleMastered } = useVocabulary();
  const shuffleSeed = useSyncExternalStore(
    subscribeToShuffleSeed,
    getShuffleSeed,
    () => 0
  );
  const now = useSyncExternalStore(
    subscribeToReviewClock,
    getReviewClockSnapshot,
    () => 0
  );
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<VocabularyStatus>("learning");
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [reviewMode, setReviewMode] = useState<"all" | "due">("all");
  const [reviewSchedules, setReviewSchedules] = useState(
    () => new Map<string, VocabularyReviewScheduleRow>()
  );
  const [areSchedulesLoaded, setAreSchedulesLoaded] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleLoadFailed, setScheduleLoadFailed] = useState(false);
  const scheduleRequestRef = useRef<Promise<void> | null>(null);

  async function loadReviewSchedules() {
    if (!isAuthenticated) return;
    if (areSchedulesLoaded || scheduleRequestRef.current) return scheduleRequestRef.current;

    setIsLoadingSchedules(true);
    setScheduleLoadFailed(false);
    const request = getVocabularyReviewSchedules()
      .then((schedules) => {
        setReviewSchedules(
          new Map(schedules.map((schedule) => [schedule.vocabulary_word_id, schedule]))
        );
        setAreSchedulesLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load review schedules:", error);
        setScheduleLoadFailed(true);
        toast.error("Could not load review schedule.");
      })
      .finally(() => {
        scheduleRequestRef.current = null;
        setIsLoadingSchedules(false);
      });

    scheduleRequestRef.current = request;
    return request;
  }

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
    const filteredWords = words.filter((word) => {
      if (
        word.status !== status ||
        (category !== "all" && word.category !== category)
      ) {
        return false;
      }
      if (reviewMode === "all") return true;
      if (!areSchedulesLoaded) return false;

      const schedule = reviewSchedules.get(word.id);
      return !schedule || new Date(schedule.due_at).getTime() <= now;
    });
    return shuffleDeck(buildDeck(filteredWords), shuffleSeed);
  }, [areSchedulesLoaded, category, now, reviewMode, reviewSchedules, shuffleSeed, status, words]);

  const dueCount = useMemo(() => words.filter((word) => {
    if (
      word.status !== status ||
      (category !== "all" && word.category !== category)
    ) {
      return false;
    }

    const schedule = reviewSchedules.get(word.id);
    return !schedule || new Date(schedule.due_at).getTime() <= now;
  }).length, [category, now, reviewSchedules, status, words]);

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
    if (!isAuthenticated || !card || card.word.isCustom || isTogglingStatus) return;

    const remembered = card.word.status === "learning";
    const nextStatus: VocabularyStatus = remembered ? "mastered" : "learning";
    setIsTogglingStatus(true);
    try {
      const updated = await toggleMastered(card.word.id, card.word.status);
      if (!updated) return;

      // Keep the changed card visible so the same button can switch it back.
      const nextDeck = shuffleDeck(
        buildDeck(
          words
            .map((word) => word.id === card.word.id ? { ...word, status: nextStatus } : word)
            .filter((word) => word.status === nextStatus && (category === "all" || word.category === category))
        ),
        shuffleSeed
      );
      setStatus(nextStatus);
      setReviewMode("all");
      setIndex(Math.max(0, nextDeck.findIndex((item) => item.word.id === card.word.id)));
      setIsRevealed(false);

      try {
        const { schedule } = await recordVocabularyReview(card.word.id, remembered);
        setReviewSchedules((current) => {
          const next = new Map(current);
          next.set(schedule.vocabulary_word_id, schedule);
          return next;
        });
      } catch (error) {
        console.error("Failed to save flashcard review:", error);
        toast.error("Status changed, but review activity could not be recorded.");
      }
    } finally {
      setIsTogglingStatus(false);
    }
  }

  if (!isLoaded) {
    return <p className="py-16 text-sm text-slate-500">Loading flashcards...</p>;
  }

  return (
    <div className="flashcards-page">
      <header className="flashcards-hero mb-4 sm:mb-5">
        <div className="flashcards-hero-copy"><p className="text-sm font-semibold text-blue-600">A little practice goes a long way</p><h1 className="page-title mt-1">Flashcards <Star className="inline size-6 fill-amber-400 text-amber-400" /></h1><p className="page-intro-description mt-2">Practice your vocabulary in a random order.</p></div>
        <Image src="/images/ui/illustrations/flashcards-apple-cat.svg" alt="" width={330} height={250} className="flashcards-hero-art" />
      </header>

      <div className={`flashcards-filters mb-4 grid gap-3 ${isAuthenticated ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
        <div>
          <p className="mb-2 text-sm font-semibold text-indigo-950">Category</p>
          <CategoryDropdown
            category={category}
            categories={categories}
            words={words}
            includeAll
            fullWidth
            onChange={changeCategory}
          />
        </div>

        {isAuthenticated && <fieldset>
          <legend className="mb-2 text-sm font-semibold text-indigo-950">
            Vocabulary status
          </legend>
          <div className="flashcards-status-switch grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
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
              <span className="inline-flex items-center gap-1.5"><Star size={15} fill="currentColor" />Learning</span>
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
              <span className="inline-flex items-center gap-1.5"><Star size={15} />Mastered</span>
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
        </fieldset>}
      </div>

      {isAuthenticated && <>
      <div
        className="flashcards-mode mb-4 flex flex-wrap items-center gap-2"
        role="group"
        aria-label="Flashcard review mode"
      >
        <button
          type="button"
          aria-pressed={reviewMode === "all"}
          onClick={() => {
            setReviewMode("all");
            setIndex(0);
            setIsRevealed(false);
          }}
          className={`flashcards-mode-button inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${reviewMode === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <Image src="/images/ui/icons/flashcards.svg" alt="" width={17} height={17} /> All cards
        </button>
        <button
          type="button"
          aria-pressed={reviewMode === "due"}
          disabled={isLoadingSchedules}
          onClick={() => {
            setReviewMode("due");
            setIndex(0);
            setIsRevealed(false);
            void loadReviewSchedules();
          }}
          className={`flashcards-mode-button inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50 ${reviewMode === "due" ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
        >
          <CalendarClock size={16} />
          Due now
          <span className={`rounded-full px-2 py-0.5 text-xs ${reviewMode === "due" ? "bg-white/20" : "bg-amber-50 text-amber-700"}`}>
            {areSchedulesLoaded ? dueCount : isLoadingSchedules ? "…" : "—"}
          </span>
        </button>
        {reviewMode === "due" && (
          <span className="text-xs text-slate-500">
            Includes new words and reviews that have reached their due date.
          </span>
        )}
      </div>
      </>}

      {card ? (
        <>
          <div className="flashcards-progress-row mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="shrink-0 font-semibold text-indigo-950" aria-live="polite">Card {index + 1} of {deck.length}</span>
            <div className="flashcards-progress-track" role="progressbar" aria-label="Flashcard progress" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index + 1}><span style={{ width: `${deck.length ? ((index + 1) / deck.length) * 100 : 0}%` }} /></div>
            <span className="flashcards-encouragement hidden items-center gap-2 font-semibold text-indigo-900 sm:inline-flex"><Star size={19} className="fill-amber-400 text-amber-400" />Let’s go! You’re doing great!</span>
          </div>

          <Card className="flashcard-stage h-[350px] overflow-hidden p-0 sm:h-[480px]">
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

          <div className="flashcards-navigation mt-4 flex items-center justify-center gap-3 sm:gap-5">
            {isAuthenticated && !card.word.isCustom && <Button
              variant="secondary"
              onClick={() => moveCard(-1)}
              disabled={deck.length < 2}
              aria-label="Previous flashcard"
            >
              <ArrowLeft size={16} />
              <span>Previous</span>
            </Button>}
            {isAuthenticated && !card.word.isCustom && <Button
              variant="secondary"
              onClick={() => void handleToggleStatus()}
              disabled={isTogglingStatus}
              aria-label={`Mark ${card.word.word} as ${card.word.status === "learning" ? "mastered" : "learning"}`}
              title={`Change status to ${card.word.status === "learning" ? "Mastered" : "Learning"}`}
              className={
                card.word.status === "learning"
                  ? "flashcards-learning-action text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              }
            >
              {card.word.status === "learning" ? <Circle size={15} /> : <Check size={15} />}
              <span>
                {isTogglingStatus
                  ? "Saving..."
                  : card.word.status === "learning" ? "Learning" : "Mastered"}
              </span>
            </Button>}
            <Button
              onClick={() => moveCard(1)}
              disabled={deck.length < 2}
              aria-label="Next flashcard"
            >
              <span>Next</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </>
      ) : (
        <Card className="px-6 py-16 text-center">
          <h2 className="font-semibold text-slate-900">
            {reviewMode === "due"
              ? isLoadingSchedules
                ? "Loading due cards..."
                : scheduleLoadFailed
                  ? "Could not load review schedule"
                  : "You are all caught up"
              : "No flashcards yet"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {reviewMode === "due"
              ? scheduleLoadFailed
                ? "Check your connection and try loading the review schedule again."
                : isLoadingSchedules
                  ? "Checking for new and due words."
                  : "There are no new or due words in this category and status."
              : "Add vocabulary or choose a category with words to start studying."}
          </p>
          {reviewMode === "due" && scheduleLoadFailed && (
            <Button className="mt-4" variant="secondary" onClick={() => void loadReviewSchedules()}>
              Try again
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
