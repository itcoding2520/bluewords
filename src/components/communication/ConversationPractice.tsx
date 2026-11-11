"use client";

import { useState } from "react";
import { Headphones, Volume2 } from "lucide-react";
import { toast } from "sonner";
import type { Dialogue, Turn } from "@/hooks/useSituationalEnglishLessonData";
import { SpeechPractice } from "@/components/communication/SpeechPractice";

type DialogueWithTurns = Dialogue & { turns: Turn[] };

export function ConversationPractice({
  dialogues,
  onPlayTurn,
}: {
  dialogues: DialogueWithTurns[];
  onPlayTurn: (turn: Turn) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  function answerDialogue(turn: Turn, answer: string) {
    setAnswers((current) => ({ ...current, [turn.id]: answer }));
    if (answer === turn.expected_response) toast.success("That's a natural response!");
    else toast("Try another response and listen to the line again.");
  }

  if (dialogues.length === 0) return null;

  return <section className="rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
    <div className="mb-4 flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Headphones size={22}/></span>
      <div><h2 className="text-xl font-extrabold text-slate-900">Conversation practice</h2><p className="text-sm text-slate-500">Listen to the conversation, then choose a natural response.</p></div>
    </div>
    <div className="space-y-5">{dialogues.map((dialogue) => <article key={dialogue.id} className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4">
      <h3 className="font-bold text-slate-900">{dialogue.title_en}</h3><p className="text-sm text-slate-500">{dialogue.prompt_vi || dialogue.title_vi}</p>
      <div className="mt-3 space-y-3">{dialogue.turns.map((turn) => {
        const interactive = turn.response_options.length > 0;
        const selectedAnswer = answers[turn.id];
        const isCorrect = selectedAnswer === turn.expected_response;
        const showResponse = !interactive || isCorrect;
        return <div key={turn.id} className="rounded-2xl bg-white p-3">
          <div className="flex items-start gap-3">
            {showResponse && <button type="button" aria-label={`Play ${turn.speaker}'s line`} onClick={() => onPlayTurn(turn)} className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Volume2 size={17}/></button>}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{interactive && !isCorrect ? "Your turn" : turn.speaker}</p>
              {showResponse ? <><p className="font-semibold text-slate-900">{turn.text_en}</p>{turn.meaning_vi && <p className="text-sm text-slate-500">{turn.meaning_vi}</p>}</> : <p className="font-semibold text-violet-800">Choose a natural response to the line above.</p>}
              {interactive && <div className="mt-3">
                <div className="flex flex-wrap gap-2">{turn.response_options.map((option) => {
                  const selected = selectedAnswer === option;
                  const optionIsCorrect = option === turn.expected_response;
                  const style = selected && optionIsCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : selected ? "border-rose-300 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-700 hover:border-blue-300";
                  return <button key={option} type="button" disabled={isCorrect} onClick={() => answerDialogue(turn, option)} className={`rounded-xl border px-3 py-2 text-sm font-medium disabled:cursor-default ${style}`}>{option}</button>;
                })}</div>
                {selectedAnswer && !isCorrect && <p role="status" className="mt-2 text-sm font-semibold text-rose-700">Not quite. Try another response.</p>}
                {isCorrect && <p role="status" className="mt-2 text-sm font-semibold text-emerald-700">That’s a natural response!</p>}
                {isCorrect && <SpeechPractice expected={turn.expected_response}/>}
              </div>}
            </div>
          </div>
        </div>;
      })}</div>
    </article>)}</div>
  </section>;
}
