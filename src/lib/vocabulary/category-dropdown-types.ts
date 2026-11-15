import type { VocabularyCategoryColor } from "@/config/vocabulary";

export interface CategoryDropdownOption {
  id: string;
  name: string;
  value: string;
  color?: VocabularyCategoryColor | null;
}
