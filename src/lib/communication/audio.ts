import { toast } from "sonner";

export function speakCommunicationText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    toast.error("Audio playback is not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function playCommunicationAudio(audioUrl: string, fallbackText: string) {
  if (audioUrl) {
    void new Audio(audioUrl).play().catch(() => speakCommunicationText(fallbackText));
    return;
  }

  speakCommunicationText(fallbackText);
}
