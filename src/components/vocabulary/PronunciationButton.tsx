"use client";

import { useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";

interface PronunciationButtonProps {
  word: string;
}

function subscribeToSpeechSupport() {
  return () => {};
}

function getSpeechSupportSnapshot() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window
  );
}

export function PronunciationButton({ word }: PronunciationButtonProps) {
  const isSupported = useSyncExternalStore(
    subscribeToSpeechSupport,
    getSpeechSupportSnapshot,
    () => false
  );

  function handleSpeak() {
    if (!isSupported || !word.trim()) return;

    const synthesis = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(word);
    const voices = synthesis.getVoices();

    utterance.lang = "en-US";
    utterance.voice =
      voices.find((voice) => voice.lang.toLowerCase() === "en-us") ??
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-")) ??
      null;

    synthesis.cancel();
    synthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={!isSupported || !word.trim()}
      aria-label={`Listen to ${word} pronunciation`}
      title={
        isSupported
          ? `Listen to ${word}`
          : "Speech synthesis is not supported in this browser"
      }
      className="inline-flex cursor-pointer size-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Volume2 size={15} aria-hidden="true" />
    </button>
  );
}
