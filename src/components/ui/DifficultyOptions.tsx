import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/types/difficulty";

type LabelStyle = "english" | "bilingual-dot" | "bilingual-slash";

const labels: Record<LabelStyle, Record<DifficultyLevel, string>> = {
  english: { easy: "Easy", medium: "Medium", hard: "Hard" },
  "bilingual-dot": { easy: "Easy · Dễ", medium: "Medium · Trung bình", hard: "Hard · Khó" },
  "bilingual-slash": { easy: "Easy / Dễ", medium: "Medium / Trung bình", hard: "Hard / Khó" },
};

export function DifficultyOptions({ labelStyle = "english" }: { labelStyle?: LabelStyle }) {
  return DIFFICULTY_LEVELS.map((level) => (
    <option key={level} value={level}>{labels[labelStyle][level]}</option>
  ));
}
