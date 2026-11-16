import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";
import { saveCommunityCategoryRequest } from "@/lib/vocabulary/publish-category-request-workflow";
import { getCurrentUserOrNull } from "@/lib/supabase/authenticated-user";

const REQUEST_SENT_MESSAGE = "Your selected vocabulary has been sent to the admin for review.";

export function usePublishCategoryRequest(
  categories: VocabularyCategoryRow[],
  setStatus: Dispatch<SetStateAction<string>>
) {
  const supabase = useSupabaseClient();

  async function publishCategory(categoryName: string) {
    if (!categoryName) return;
    const user = await getCurrentUserOrNull(supabase);
    if (!user) return;

    const category = categories.find((item) => item.name === categoryName);
    const normalizedCategory = normalizeVocabularyText(categoryName);
    const result = await saveCommunityCategoryRequest(supabase, {
      ownerId: user.id,
      name: categoryName,
      normalizedName: normalizedCategory,
      color: category?.color ?? "blue",
      imagePath: category?.image_path ?? null,
    });
    if (result.status === "error") {
      toast.error(result.source === "create" && result.code === "23505"
        ? "A request for this category already exists."
        : result.message);
      return;
    }
    if (result.status === "existing") {
      toast.info(result.requestStatus === "published"
        ? "This category is already published."
        : result.requestStatus === "removed"
          ? "This category was removed and cannot be requested again."
          : "This category already has a review request.");
      return;
    }
    if (result.status === "resubmit_unavailable") {
      toast.info("This category is no longer available to resubmit. Refresh the page and try again.");
      return;
    }

    if (result.status === "resubmitted" || result.status === "created") {
      setStatus(REQUEST_SENT_MESSAGE);
      toast.success(result.status === "resubmitted" ? "Category request sent again." : "Category request sent.");
    }
  }

  return publishCategory;
}
