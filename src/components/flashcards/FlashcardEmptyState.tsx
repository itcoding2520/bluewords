import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function FlashcardEmptyState({
  reviewMode,
  isLoadingSchedules,
  scheduleLoadFailed,
  onRetry,
}: {
  reviewMode: "all" | "due";
  isLoadingSchedules: boolean;
  scheduleLoadFailed: boolean;
  onRetry: () => void;
}) {
  const title = reviewMode === "due"
    ? isLoadingSchedules
      ? "Loading due cards..."
      : scheduleLoadFailed
        ? "Could not load review schedule"
        : "You are all caught up"
    : "No flashcards yet";

  const description = reviewMode === "due"
    ? scheduleLoadFailed
      ? "Check your connection and try loading the review schedule again."
      : isLoadingSchedules
        ? "Checking for new and due words."
        : "There are no new or due words in this category and status."
    : "Add vocabulary or choose a category with words to start studying.";

  return (
    <Card className="px-6 py-16 text-center">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {reviewMode === "due" && scheduleLoadFailed && (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}
