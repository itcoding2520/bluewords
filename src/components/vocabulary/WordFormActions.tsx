import { Button } from "@/components/ui/Button";

export function WordFormActions({
  isSubmitting,
  isEditing,
  onClose,
}: {
  isSubmitting: boolean;
  isEditing: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="secondary"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? "Saving..."
          : isEditing
            ? "Save changes"
            : "Add word"}
      </Button>
    </div>
  );
}
