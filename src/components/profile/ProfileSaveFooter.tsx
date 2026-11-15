import { Camera, Check, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";

export function ProfileSaveFooter({
  saving,
  disabled,
}: {
  saving: boolean;
  disabled: boolean;
}) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="profile-privacy-note text-xs leading-5 text-slate-400">
        <ShieldCheck className="size-7 shrink-0" />
        <span>
          Your nickname and avatar are visible to other users in the game leaderboard.
          <br />Your email stays private.
        </span>
      </p>
      <Button type="submit" disabled={disabled}>
        {saving ? <><Camera size={16} /> Saving…</> : <><Check size={16} /> Save profile</>}
      </Button>
    </div>
  );
}
