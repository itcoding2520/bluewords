import { shuffle } from "@/lib/random";
import { groupBy } from "@/lib/group-by";

type DialogueRecord = { id: string };
type DialogueTurnRecord = { dialogue_id: string; response_options: string[] | null };

export function attachDialogueTurns<
  TDialogue extends DialogueRecord,
  TTurn extends DialogueTurnRecord,
>(dialogues: TDialogue[], turns: TTurn[]) {
  const turnsByDialogue = groupBy(turns, (turn) => turn.dialogue_id);

  return dialogues.map((dialogue) => ({
    ...dialogue,
    turns: (turnsByDialogue.get(dialogue.id) ?? []).map((turn) => ({
      ...turn,
      response_options: shuffle(turn.response_options ?? []),
    })),
  }));
}
