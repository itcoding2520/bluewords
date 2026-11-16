import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WordSearchHistoryPagination({
  historyPage,
  totalPages,
  historyLoading,
  historyError,
  onPageChange,
}: {
  historyPage: number;
  totalPages: number;
  historyLoading: boolean;
  historyError: string;
  onPageChange: (page: number) => void;
}) {
  if (historyLoading || historyError) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
      <span>Page {historyPage} of {totalPages}</span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          aria-label="Previous history page"
          disabled={historyPage <= 1}
          onClick={() => onPageChange(historyPage - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <Button
          variant="secondary"
          aria-label="Next history page"
          disabled={historyPage >= totalPages}
          onClick={() => onPageChange(historyPage + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
