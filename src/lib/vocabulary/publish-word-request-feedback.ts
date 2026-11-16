import type { PublishableWord, PublishWordSubmissionResult } from "@/lib/vocabulary/publish-word-request-submission";

export type PublishWordRequestFeedback = {
  kind: "error" | "info" | "success";
  message: string;
  requestSent?: boolean;
};

export function getPublishWordRequestFeedback(
  result: PublishWordSubmissionResult,
  word: PublishableWord,
): PublishWordRequestFeedback | null {
  if (result.status === "default_word") {
    return {
      kind: "info",
      message: "“" + word.word + "” is already part of the default vocabulary in " + word.category + ".",
    };
  }
  if (result.status === "category_resolution_error") {
    return {
      kind: "error",
      message: result.source === "create" && result.code === "23505"
        ? "This category already has a review request."
        : result.message,
    };
  }
  if (result.status === "default_category_unavailable") {
    return {
      kind: "error",
      message: "This shared category is not available for word requests yet. Refresh the page and try again.",
    };
  }
  if (result.status === "category_not_found") {
    return { kind: "error", message: "Could not locate the category." };
  }
  if (result.status === "category_not_available") {
    return { kind: "error", message: "Words can only be requested in your own or an approved category." };
  }
  if (result.status === "published_word_lookup_error") {
    return { kind: "error", message: result.message };
  }
  if (result.status === "already_published") {
    return {
      kind: "info",
      message: "“" + word.word + "” is already published in " + word.category + ".",
    };
  }
  if (result.status !== "saved") return null;

  if (result.result.status === "error") {
    return {
      kind: "error",
      message: result.result.source === "create" && result.result.code === "23505"
        ? "“" + word.word + "” already has a submission in this category."
        : result.result.message,
    };
  }
  if (result.result.status === "existing") {
    return {
      kind: "info",
      message: result.result.requestStatus === "removed"
        ? "This request was removed and cannot be sent again."
        : "This word already has a review request.",
    };
  }
  if (result.result.status === "resubmit_unavailable") {
    return {
      kind: "info",
      message: "This word is no longer available to resubmit. Refresh the page and try again.",
    };
  }
  return {
    kind: "success",
    message: result.result.status === "resubmitted" ? "Word request sent again." : "Word request sent.",
    requestSent: true,
  };
}
