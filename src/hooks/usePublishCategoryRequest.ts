import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { normalize } from "@/lib/vocabulary/publish-options";
import {
  createCommunityCategoryRequest,
  findCommunityCategoryRequest,
  resubmitCommunityCategoryRequest,
} from "@/lib/supabase/publish-category-request";

const REQUEST_SENT_MESSAGE = "Your selected vocabulary has been sent to the admin for review.";

export function usePublishCategoryRequest(
  categories: VocabularyCategoryRow[],
  setStatus: Dispatch<SetStateAction<string>>
) {
  const supabase = useSupabaseClient();

  async function publishCategory(categoryName: string) {
    if (!categoryName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const category = categories.find((item) => item.name === categoryName);
    const normalizedCategory = normalize(categoryName);
    const found = await findCommunityCategoryRequest(supabase, normalizedCategory);
    if (found.error) {
      toast.error(found.error.message);
      return;
    }

    if (found.data) {
      if (found.data.status === "rejected") {
        const { data: updated, error } = await resubmitCommunityCategoryRequest(supabase, {
          id: found.data.id,
          ownerId: user.id,
          imagePath: category?.image_path ?? null,
        });
        if (error) toast.error(error.message);
        else if (!updated) toast.info("This category is no longer available to resubmit. Refresh the page and try again.");
        else {
          setStatus(REQUEST_SENT_MESSAGE);
          toast.success("Category request sent again.");
        }
      } else {
        toast.info(found.data.status === "published"
          ? "This category is already published."
          : found.data.status === "removed"
            ? "This category was removed and cannot be requested again."
            : "This category already has a review request.");
      }
      return;
    }

    const { error } = await createCommunityCategoryRequest(supabase, {
      ownerId: user.id,
      name: categoryName,
      color: category?.color ?? "blue",
      imagePath: category?.image_path ?? null,
    });
    if (error) toast.error(error.code === "23505" ? "A request for this category already exists." : error.message);
    else {
      setStatus(REQUEST_SENT_MESSAGE);
      toast.success("Category request sent.");
    }
  }

  return publishCategory;
}
