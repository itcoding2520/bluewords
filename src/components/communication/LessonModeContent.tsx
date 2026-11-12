import type { ComponentProps } from "react";

import { ListeningPracticeView } from "@/components/communication/ListeningPracticeView";
import { QuickPracticeView } from "@/components/communication/QuickPracticeView";
import { SentenceDrillView } from "@/components/communication/SentenceDrillView";
import { StudyCardView } from "@/components/communication/StudyCardView";

type LessonMode = "study" | "practice" | "drills" | "listening";

type LessonModeContentProps = {
  mode: LessonMode;
  study: ComponentProps<typeof StudyCardView>;
  practice: ComponentProps<typeof QuickPracticeView>;
  drills: ComponentProps<typeof SentenceDrillView>;
  listening: ComponentProps<typeof ListeningPracticeView>;
};

export function LessonModeContent({ mode, study, practice, drills, listening }: LessonModeContentProps) {
  if (mode === "study") return <StudyCardView {...study} />;
  if (mode === "practice") return <div className="p-4 sm:p-7"><QuickPracticeView {...practice} /></div>;
  if (mode === "listening") return <div className="p-4 sm:p-7"><ListeningPracticeView {...listening} /></div>;
  return <div className="p-4 sm:p-7"><SentenceDrillView {...drills} /></div>;
}
