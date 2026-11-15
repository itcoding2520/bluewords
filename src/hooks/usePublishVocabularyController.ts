import { useState } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useVocabulary } from "@/contexts/VocabularyContext";
import {
  getPublishVocabularyOptions,
  normalize,
} from "@/lib/vocabulary/publish-options";
import { usePublishVocabularyRequests } from "@/hooks/usePublishVocabularyRequests";

export function usePublishVocabularyController() {
  const { words, categories, isAuthenticated, isLoaded } = useVocabulary();
  const supabase = useSupabaseClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const {
    communityCategoryRequests,
    communityWordRequests,
    requestsLoaded,
    refreshRequests,
  } = usePublishVocabularyRequests(isAuthenticated);

  const {
    defaultCategoryNames,
    communityCategoryNames,
    defaultWordKeys,
    requestableCategories,
    requestableWords,
    userWords,
  } = getPublishVocabularyOptions({
    categories,
    words,
    categoryRequests: communityCategoryRequests,
    wordRequests: communityWordRequests,
  });

  async function publishCategory(categoryName: string) {
    if (!categoryName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const normalizedCategory = categoryName.trim().replace(/\s+/g, " ").toLowerCase();
    const found = await supabase.from("community_categories")
      .select("id, status").eq("normalized_name", normalizedCategory).maybeSingle();
    if (found.error) { toast.error(found.error.message); return; }
    if (found.data) {
      if (found.data.status === "rejected") {
        const { data: updated, error } = await supabase.from("community_categories")
          .update({ status: "pending", image_path: categories.find((item) => item.name === categoryName)?.image_path ?? null })
          .eq("id", found.data.id).eq("owner_id", user.id).eq("status", "rejected")
          .select("id").maybeSingle();
        if (error) toast.error(error.message);
        else if (!updated) toast.info("This category is no longer available to resubmit. Refresh the page and try again.");
        else {
          setStatus("Your selected vocabulary has been sent to the admin for review.");
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
    const { error } = await supabase.from("community_categories").insert({
      owner_id: user.id,
      name: categoryName,
      color: categories.find((item) => item.name === categoryName)?.color ?? "blue",
      image_path: categories.find((item) => item.name === categoryName)?.image_path ?? null,
      status: "pending",
    });
    if (error) toast.error(error.code === "23505" ? "A request for this category already exists." : error.message);
    else {
      setStatus("Your selected vocabulary has been sent to the admin for review.");
      toast.success("Category request sent.");
    }
  }

  async function publishWord(wordId: string) {
    if (!userWords.some((item) => item.id === wordId)) {
      toast.error("You can only request words from your own vocabulary.");
      return;
    }
    const word = requestableWords.find((item) => item.id === wordId);
    if (!word) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (wordId.startsWith("retry-word-")) {
      const previousRequestId = wordId.slice("retry-word-".length);
      const ownRejectedRequest = communityWordRequests.some((request) =>
        request.id === previousRequestId && request.owner_id === user.id && request.status === "rejected"
      );
      if (!ownRejectedRequest) {
        toast.error("You can only resubmit a rejected word request that you created.");
        return;
      }
    } else {
      const { data: ownWord, error: ownershipError } = await supabase.from("vocabulary_words")
        .select("id").eq("id", word.id).eq("user_id", user.id).maybeSingle();
      if (ownershipError) { toast.error(ownershipError.message); return; }
      if (!ownWord) {
        toast.error("You can only request words from your own vocabulary.");
        return;
      }
    }
    const normalizedCategory = word.category.trim().replace(/\s+/g, " ").toLowerCase();
    const normalizedWord = word.word.trim().replace(/\s+/g, " ").toLowerCase();
    if (defaultWordKeys.has(`${normalizedCategory}\u0000${normalizedWord}`)) {
      toast.info(`“${word.word}” is already part of the default vocabulary in ${word.category}.`);
      return;
    }
    const categoryResult = await supabase.from("community_categories")
      .select("id, owner_id, status").eq("normalized_name", normalizedCategory).maybeSingle();
    if (categoryResult.error) { toast.error(categoryResult.error.message); return; }
    let communityCategory = categoryResult.data;
    if (!communityCategory) {
      if (defaultCategoryNames.has(normalizedCategory)) {
        toast.error("This shared category is not available for word requests yet. Refresh the page and try again.");
        return;
      }
      const created = await supabase.from("community_categories").insert({
        owner_id: user.id,
        name: word.category,
        color: categories.find((item) => item.name === word.category)?.color ?? "blue",
        image_path: categories.find((item) => item.name === word.category)?.image_path ?? null,
        status: "pending",
      }).select("id, owner_id, status").single();
      if (created.error) {
        toast.error(created.error.code === "23505" ? "This category already has a review request." : created.error.message);
        return;
      }
      communityCategory = created.data;
    }
    if (!communityCategory) { toast.error("Could not locate the category."); return; }
    if (communityCategory.status !== "published"
      && !(communityCategory.status === "pending" && communityCategory.owner_id === user.id)) {
      toast.error("Words can only be requested in your own or an approved category.");
      return;
    }
    const alreadyPublished = await supabase.from("community_words").select("id")
      .eq("category_id", communityCategory.id).eq("normalized_word", normalizedWord)
      .eq("status", "published").maybeSingle();
    if (alreadyPublished.error) { toast.error(alreadyPublished.error.message); return; }
    if (alreadyPublished.data) {
      toast.info(`“${word.word}” is already published in ${word.category}.`);
      return;
    }
    const previous = await supabase.from("community_words").select("id, status")
      .eq("owner_id", user.id).eq("category_id", communityCategory.id)
      .eq("normalized_word", normalizedWord).maybeSingle();
    if (previous.error) { toast.error(previous.error.message); return; }
    if (previous.data) {
      if (previous.data.status !== "rejected") {
        toast.info(previous.data.status === "removed"
          ? "This request was removed and cannot be sent again."
          : "This word already has a review request.");
        return;
      }
      const { data: updated, error } = await supabase.from("community_words")
        .update({ word: word.word, meaning: word.meaning, ipa: word.ipa ?? null, status: "pending" })
        .eq("id", previous.data.id).eq("owner_id", user.id).eq("status", "rejected")
        .select("id").maybeSingle();
      if (error) toast.error(error.message);
      else if (!updated) toast.info("This word is no longer available to resubmit. Refresh the page and try again.");
      else {
        setStatus("Your selected vocabulary has been sent to the admin for review.");
        toast.success("Word request sent again.");
      }
      return;
    }
    const { error } = await supabase.from("community_words").insert({
      owner_id: user.id,
      category_id: communityCategory.id,
      source_vocabulary_word_id: word.id,
      word: word.word,
      meaning: word.meaning,
      ipa: word.ipa ?? null,
      image_path: null,
      status: "pending",
    });
    if (error) toast.error(error.code === "23505"
      ? `“${word.word}” already has a submission in this category.`
      : error.message);
    else {
      setStatus("Your selected vocabulary has been sent to the admin for review.");
      toast.success("Word request sent.");
    }
  }

  async function sendCategoryRequests() {
    if (!selectedCategories.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selectedCategories) await publishCategory(item);
      setSelectedCategories([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send category requests.");
    } finally {
      setBusy(false);
    }
  }

  async function sendWordRequests() {
    if (!selectedWordIds.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selectedWordIds) await publishWord(item);
      setSelectedWordIds([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send word requests.");
    } finally {
      setBusy(false);
    }
  }

  function toggleCategoryRequest(categoryName: string, checked: boolean) {
    const normalizedName = normalize(categoryName);
    setSelectedCategories((current) => checked
      ? current.includes(categoryName) ? current : [...current, categoryName]
      : current.filter((name) => name !== categoryName));
    const categoryWordIds = userWords
      .filter((word) => normalize(word.category) === normalizedName)
      .map((word) => word.id);
    setSelectedWordIds((current) => checked
      ? [...new Set([...current, ...categoryWordIds])]
      : current.filter((id) => !categoryWordIds.includes(id)));
  }

  return {
    isLoaded,
    isAuthenticated,
    selectedCategories,
    selectedWordIds,
    setSelectedWordIds,
    busy,
    status,
    requestsLoaded,
    communityCategoryRequests,
    communityWordRequests,
    communityCategoryNames,
    requestableCategories,
    userWords,
    sendCategoryRequests,
    sendWordRequests,
    toggleCategoryRequest,
  };
}
