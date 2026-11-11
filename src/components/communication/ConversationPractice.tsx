"use client";

import { useState } from "react";
import { Headphones } from "lucide-react";
import { toast } from "sonner";
import type { Dialogue, Turn } from "@/hooks/useSituationalEnglishLessonData";
import { DialogueTurnView } from "@/components/communication/DialogueTurnView";

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
      <div className="mt-3 space-y-3">{dialogue.turns.map((turn) => <DialogueTurnView
        key={turn.id}
        turn={turn}
        selectedAnswer={answers[turn.id]}
        onPlay={onPlayTurn}
        onSelect={answerDialogue}
      />)}</div>
    </article>)}</div>
  </section>;
}
