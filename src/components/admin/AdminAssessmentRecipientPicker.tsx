import type { AssessmentAdminUser } from "@/lib/assessments/admin-api";

export function AdminAssessmentRecipientPicker({
  selectedIds,
  search,
  visibleUsers,
  onSelectedChange,
  onSearchChange,
}: {
  selectedIds: ReadonlySet<string>;
  search: string;
  visibleUsers: AssessmentAdminUser[];
  onSelectedChange: (update: (current: string[]) => string[]) => void;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="assessment-user-picker">
      <input
        aria-label="Search learners"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by email or nickname"
      />
      <div>
        {visibleUsers.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={(event) => onSelectedChange((current) => event.target.checked
                ? [...current, item.id]
                : current.filter((id) => id !== item.id))}
            />
            <span><b>{item.nickname || item.email || "Learner"}</b><small>{item.email}</small></span>
          </label>
        ))}
      </div>
    </div>
  );
}
