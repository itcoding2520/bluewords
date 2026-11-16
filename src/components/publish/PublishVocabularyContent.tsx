"use client";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { usePublishVocabularyController } from "@/hooks/usePublishVocabularyController";
import { PublishCategoryRequestsCard } from "@/components/publish/PublishCategoryRequestsCard";
import { PublishWordRequestsCard } from "@/components/publish/PublishWordRequestsCard";

export function PublishVocabularyContent() {
  const {
    account: { isLoaded, isAuthenticated },
    requests: {
      requestsLoaded, communityCategoryRequests, communityWordRequests,
      communityCategoryNames,
    },
    selection: {
      selectedCategories, selectedWordIds, setSelectedWordIds,
      toggleCategoryRequest,
    },
    view: { requestableCategories, userWords },
    submission: { busy, status },
    actions: { sendCategoryRequests, sendWordRequests },
  } = usePublishVocabularyController();

  if (!isLoaded) return <p className="py-12 text-center text-slate-600">Checking your session…</p>;
  if (!isAuthenticated) return <p className="py-12 text-center text-slate-600">Sign in to submit vocabulary for publishing.</p>;

  return <div className="publish-vocabulary-page">
    <header className="mb-6"><p className="text-sm font-semibold text-blue-600">Community vocabulary</p><h1 className="page-title mt-1">Send category or word requests</h1><p className="page-intro-description mt-2">Select multiple items to send requests together. Admins review them before they become visible to everyone, including guests.</p></header>
    {status && <AutoDismissMessage key={status} variant="success" className="mb-4">{status}</AutoDismissMessage>}
    <div className="publish-request-grid">
      <PublishCategoryRequestsCard
        requestsLoaded={requestsLoaded}
        requestableCategories={requestableCategories}
        selectedCategories={selectedCategories}
        communityCategoryRequests={communityCategoryRequests}
        busy={busy}
        onToggle={toggleCategoryRequest}
        onSend={() => void sendCategoryRequests()}
      />
      <PublishWordRequestsCard
        requestsLoaded={requestsLoaded}
        selectedWordIds={selectedWordIds}
        setSelectedWordIds={setSelectedWordIds}
        userWords={userWords}
        communityWordRequests={communityWordRequests}
        communityCategoryNames={communityCategoryNames}
        busy={busy}
        onSend={() => void sendWordRequests()}
      />
    </div>
    <aside className="publish-request-note"><span>💡</span><p>You can request added words from your custom categories and the default categories.<br className="hidden sm:block" /> Only one English word can be published in a given category.</p></aside>
  </div>;
}
