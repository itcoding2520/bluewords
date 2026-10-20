interface DashboardHeaderProps {
  dateLabel: string;
  greeting: string;
  email?: string | null;
  nickname?: string | null;
}

export function DashboardHeader({
  dateLabel,
  greeting,
  email,
  nickname,
}: DashboardHeaderProps) {
  const displayName = nickname?.trim() || email;
  return (
    <header className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-blue-600">
          {dateLabel}
        </p>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {greeting} 👋
        </h1>

        {displayName && (
          <p className="mt-2 break-all text-sm font-medium text-blue-600">
            Welcome back, {displayName}
          </p>
        )}

        <p className="mt-2 text-slate-500">
          Small progress is still progress. Keep going.
        </p>
      </div>
    </header>
  );
}
