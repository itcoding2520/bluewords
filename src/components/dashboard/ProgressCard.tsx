import { Card } from "@/components/ui/Card";

interface ProgressCardProps {
  total: number;
  mastered: number;
  progress: number;
}

export function ProgressCard({
  total,
  mastered,
  progress,
}: ProgressCardProps) {
  return (
    <Card className="mt-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            Learning progress
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {mastered} of {total} words mastered
          </p>
        </div>

        <span className="text-2xl font-semibold text-slate-900">
          {progress}%
        </span>
      </div>

      <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </Card>
  );
}