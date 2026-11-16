import { useMemo } from "react";
import { BookOpen, CheckCircle2, Clock3 } from "lucide-react";

import { getCommunityContentStatus, type CategoryTab, type CommunityCategory } from "@/lib/admin-category-data";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";

const tabs: Array<{
  id: CategoryTab;
  label: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  { id: "default", label: "Default", description: "Starter categories and words", icon: BookOpen },
  { id: "published", label: "Custom published", description: "Visible to signed-in users", icon: CheckCircle2 },
  { id: "pending", label: "Custom waiting publish", description: "Awaiting admin approval", icon: Clock3 },
];

interface AdminCategoryTabsProps {
  activeTab: CategoryTab;
  communityCategories: CommunityCategory[];
  onChange: (tab: CategoryTab) => void;
}

export function AdminCategoryTabs({ activeTab, communityCategories, onChange }: AdminCategoryTabsProps) {
  const communityCategoryCounts = useMemo(() => {
    const counts = new Map<"pending" | "published", number>([["pending", 0], ["published", 0]]);
    for (const category of communityCategories) {
      counts.set(category.status, (counts.get(category.status) ?? 0) + 1);
    }
    return counts;
  }, [communityCategories]);

  return (
    <div role="tablist" aria-label="Category type" className="admin-category-tabs mb-5 grid gap-2 sm:grid-cols-3">
      {tabs.map(({ id, label, description, icon: Icon }) => {
        const count = id === "default"
          ? defaultVocabularyCategories.length
          : communityCategoryCounts.get(getCommunityContentStatus(id)) ?? 0;
        const active = activeTab === id;

        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`admin-category-tab flex min-w-0 items-center gap-3 rounded-2xl border p-4 text-left transition ${active ? "is-selected border-blue-300 bg-blue-50 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
          >
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={19} /></span>
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{label}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-white text-blue-700" : "bg-slate-100 text-slate-600"}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
