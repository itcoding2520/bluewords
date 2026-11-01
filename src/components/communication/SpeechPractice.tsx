"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Play, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";

type RecognitionResult = { 0: { transcript: string }; isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}' ]/gu, " ").replace(/\s+/g, " ").trim();
}

function similarity(expected: string, actual: string) {
  const left = normalize(expected).split(" ").filter(Boolean);
  const right = normalize(actual).split(" ").filter(Boolean);
  if (!left.length || !right.length) return 0;
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (left[i - 1] === right[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return Math.max(0, Math.round((1 - row[right.length] / Math.max(left.length, right.length)) * 100));
}

export function SpeechPractice({ expected }: { expected: string }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recorderRef.current?.state !== "inactive" && recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      toast.error("Audio recording is not supported here. Try a recent browser over HTTPS.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      setTranscript("");
      const preferredMime = ["audio/webm;codecs=opus", "audio/mp4"].find((mime) => MediaRecorder.isTypeSupported(mime));
      const recorder = new MediaRecorder(stream, preferredMime ? { mimeType: preferredMime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size) {
          setAudioUrl((oldUrl) => {
            if (oldUrl) URL.revokeObjectURL(oldUrl);
            return URL.createObjectURL(blob);
          });
        }
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
      };
      const speechWindow = window as SpeechWindow;
      const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (Recognition) {
        const recognition = new Recognition();
        recognition.lang = "en-US";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event) => {
          const text = Array.from({ length: event.results.length }, (_, index) => event.results[index]?.[0]?.transcript ?? "").join(" ").trim();
          if (text) setTranscript(text);
        };
        recognition.onerror = () => undefined;
        recognitionRef.current = recognition;
        try { recognition.start(); } catch { recognitionRef.current = null; }
      }
      recorder.start();
      setRecording(true);
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      toast.error(name === "NotAllowedError" ? "Microphone access was blocked. Allow microphone access and try again." : "Could not start the microphone. Check that it is available and try again.");
    }
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setRecording(false);
  }

  const score = transcript ? similarity(expected, transcript) : null;

  return <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-sm font-bold text-violet-950">Practice saying this response</p><p className="text-xs text-slate-500">{recording ? "Listening… speak clearly, then stop." : "BlueWords does not upload or save your recording. Transcript feedback may use your browser’s speech service."}</p></div>
      <div className="flex flex-wrap gap-2">
        {!recording ? <button type="button" onClick={() => void startRecording()} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-violet-700 px-3 text-sm font-bold text-white"><Mic size={15}/> Record</button> : <button type="button" onClick={stopRecording} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-rose-600 px-3 text-sm font-bold text-white"><Square size={14}/> Stop</button>}
        {audioUrl && <button type="button" onClick={() => new Audio(audioUrl).play()} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-800"><Play size={15}/> Play recording</button>}
        {audioUrl && <button type="button" onClick={() => { setAudioUrl((oldUrl) => { if (oldUrl) URL.revokeObjectURL(oldUrl); return ""; }); setTranscript(""); }} aria-label="Clear recording" className="grid size-9 place-items-center rounded-full border border-violet-200 bg-white text-violet-700"><RotateCcw size={15}/></button>}
      </div>
    </div>
    {transcript && <div className="mt-3 rounded-lg bg-white p-3" aria-live="polite"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Heard</p><p className="mt-1 text-sm font-medium text-slate-800">{transcript}</p><p className={`mt-1 text-sm font-bold ${score !== null && score >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{score}% match · {score !== null && score >= 80 ? "Nice speaking!" : "Try once more, a little slower."}</p></div>}
    {!transcript && audioUrl && <p className="mt-2 text-xs text-slate-500">Automatic transcript feedback is unavailable in this browser. Play your recording and compare it with the example.</p>}
  </div>;
}
