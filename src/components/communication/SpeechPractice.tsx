"use client";

import { Mic, Play, RotateCcw, Square } from "lucide-react";
import { useSpeechPractice } from "@/hooks/useSpeechPractice";

export function SpeechPractice({ expected }: { expected: string }) {
  const { recording, transcript, audioUrl, score, startRecording, stopRecording, clearRecording, playRecording } = useSpeechPractice(expected);

  return <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-sm font-bold text-violet-950">Practice saying this response</p><p className="text-xs text-slate-500">{recording ? "Listening… speak clearly, then stop." : "BlueWords does not upload or save your recording. Transcript feedback may use your browser’s speech service."}</p></div>
      <div className="flex flex-wrap gap-2">
        {!recording ? <button type="button" onClick={() => void startRecording()} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-violet-700 px-3 text-sm font-bold text-white"><Mic size={15}/> Record</button> : <button type="button" onClick={stopRecording} className="inline-flex min-h-9 items-center gap-2 rounded-full bg-rose-600 px-3 text-sm font-bold text-white"><Square size={14}/> Stop</button>}
        {audioUrl && <button type="button" onClick={playRecording} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-violet-200 bg-white px-3 text-sm font-semibold text-violet-800"><Play size={15}/> Play recording</button>}
        {audioUrl && <button type="button" onClick={clearRecording} aria-label="Clear recording" className="grid size-9 place-items-center rounded-full border border-violet-200 bg-white text-violet-700"><RotateCcw size={15}/></button>}
      </div>
    </div>
    {transcript && <div className="mt-3 rounded-lg bg-white p-3" aria-live="polite"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Heard</p><p className="mt-1 text-sm font-medium text-slate-800">{transcript}</p><p className={`mt-1 text-sm font-bold ${score !== null && score >= 80 ? "text-emerald-700" : "text-amber-700"}`}>{score}% match · {score !== null && score >= 80 ? "Nice speaking!" : "Try once more, a little slower."}</p></div>}
    {!transcript && audioUrl && <p className="mt-2 text-xs text-slate-500">Automatic transcript feedback is unavailable in this browser. Play your recording and compare it with the example.</p>}
  </div>;
}
