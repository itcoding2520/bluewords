import { shuffled } from "@/lib/communication/lesson-practice";

type DialogueRecord = { id: string };
type DialogueTurnRecord = { dialogue_id: string; response_options: string[] | null };

export function attachDialogueTurns<
  TDialogue extends DialogueRecord,
  TTurn extends DialogueTurnRecord,
>(dialogues: TDialogue[], turns: TTurn[]) {
  const turnsByDialogue = new Map<string, TTurn[]>();

  for (const turn of turns) {
    const dialogueTurns = turnsByDialogue.get(turn.dialogue_id);
    if (dialogueTurns) dialogueTurns.push(turn);
    else turnsByDialogue.set(turn.dialogue_id, [turn]);
  }

  return dialogues.map((dialogue) => ({
    ...dialogue,
    turns: (turnsByDialogue.get(dialogue.id) ?? []).map((turn) => ({
      ...turn,
      response_options: shuffled(turn.response_options ?? []),
    })),
  }));
}
