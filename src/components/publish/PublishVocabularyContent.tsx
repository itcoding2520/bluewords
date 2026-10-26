"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, FolderHeart, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { createClient } from "@/lib/supabase/client";
import { getCachedPublishRequests, invalidatePublishRequestCache } from "@/lib/supabase/publish-request-cache.mjs";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type CommunityCategoryRequest = { id: string; owner_id: string; name: string; status: string };
type CommunityWordRequest = { id: string; owner_id: string; category_id: string; normalized_word: string; word: string; meaning: string; ipa: string | null; category_name: string; status: string };

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function PublishVocabularyContent() {
  const { words, categories, isAuthenticated, isLoaded } = useVocabulary();
  const [supabase] = useState(() => createClient());
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [communityCategoryRequests, setCommunityCategoryRequests] = useState<CommunityCategoryRequest[]>([]);
  const [communityWordRequests, setCommunityWordRequests] = useState<CommunityWordRequest[]>([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  const loadPublishRequests = useCallback(async () => {
    const [categoryResult, wordResult] = await Promise.all([
      supabase.from("community_categories").select("id, owner_id, name, status"),
      supabase.from("community_words").select("id, owner_id, category_id, normalized_word, word, meaning, ipa, status, community_categories!inner(name)").in("status", ["pending", "published", "rejected"]),
    ]);
    if (categoryResult.error || wordResult.error) {
      throw new Error(categoryResult.error?.message ?? wordResult.error?.message ?? "Could not load request status.");
    }
    return {
      categories: (categoryResult.data ?? []) as CommunityCategoryRequest[],
      words: ((wordResult.data ?? []) as unknown as Array<CommunityWordRequest & { community_categories: { name: string } }>).map(({ community_categories, ...item }) => ({ ...item, category_name: community_categories.name })),
    };
  }, [supabase]);

  useEffect(() => {
    let active = true;
    async function loadRequests() {
      if (!isAuthenticated) {
        setCommunityCategoryRequests([]);
        setCommunityWordRequests([]);
        setRequestsLoaded(true);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRequestsLoaded(true);
          return;
        }
        const requests = await getCachedPublishRequests(user.id, loadPublishRequests);
        if (!active) return;
        setCommunityCategoryRequests(requests.categories);
        setCommunityWordRequests(requests.words);
        setRequestsLoaded(true);
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Could not load request status.");
          setRequestsLoaded(true);
        }
      }
    }
    const loadingTimer = window.setTimeout(() => { if (active) setRequestsLoaded(false); }, 0);
    void loadRequests();
    return () => { active = false; window.clearTimeout(loadingTimer); };
  }, [isAuthenticated, loadPublishRequests, supabase]);

  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((item) => normalize(item.name)));
  const communityCategoryNames = new Map(communityCategoryRequests.map((item) => [item.id, normalize(item.name)]));
  const ownCommunityCategoryIds = new Set(communityCategoryRequests.filter((item) => item.owner_id && item.status !== "removed").map((item) => item.id));
  const blockedCategoryNames = new Set(communityCategoryRequests.filter((item) => item.status === "pending" || item.status === "published").map((item) => normalize(item.name)));
  const userCategories = categories.filter((item) => {
    const normalizedName = normalize(item.name);
    const isOwnedCommunityCategory = !item.id.startsWith("community-category-") || ownCommunityCategoryIds.has(item.id.slice("community-category-".length));
    return !item.is_default && !defaultCategoryNames.has(normalizedName) && isOwnedCommunityCategory && !blockedCategoryNames.has(normalizedName);
  });
  const visibleCategoryNames = new Set(userCategories.map((item) => normalize(item.name)));
  const rejectedCategoryFallbacks = communityCategoryRequests.filter((item) => item.owner_id && item.status === "rejected" && !defaultCategoryNames.has(normalize(item.name)) && !visibleCategoryNames.has(normalize(item.name))).map((item) => ({
    id: `retry-category-${item.id}`,
    name: item.name,
    color: "blue",
  }));
  const requestableCategories = [...userCategories, ...rejectedCategoryFallbacks];
  const userCategoryNames = new Set(requestableCategories.map((item) => normalize(item.name)));
  const defaultWordKeys = new Set(defaultVocabularyWords.map((item) => `${normalize(item.category)}\u0000${normalize(item.word)}`));
  const ownCommunityCategoryNames = new Set(communityCategoryRequests.filter((item) => item.owner_id && item.status !== "removed").map((item) => normalize(item.name)));
  const blockedWordKeys = new Set(communityWordRequests.filter((item) => item.status === "pending" || item.status === "published").flatMap((item) => {
    const categoryName = communityCategoryNames.get(item.category_id);
    return categoryName ? [`${categoryName}\u0000${normalize(item.normalized_word)}`] : [];
  }));
  const personalWordKeys = new Set(words.map((item) => `${normalize(item.category)}\u0000${normalize(item.word)}`));
  const rejectedWordFallbacks = communityWordRequests.filter((item) => item.status === "rejected" && item.owner_id && !personalWordKeys.has(`${normalize(item.category_name)}\u0000${normalize(item.word)}`)).map((item) => ({
    id: `retry-word-${item.id}`,
    word: item.word,
    meaning: item.meaning,
    category: item.category_name,
    ipa: item.ipa,
  }));
  const requestableWords = [...words, ...rejectedWordFallbacks];
  const userWords = requestableWords.filter((item) => {
    if (item.id.startsWith("community-")) return false;
    const categoryKey = normalize(item.category);
    const wordKey = `${categoryKey}\u0000${normalize(item.word)}`;
    const isDefaultWord = defaultWordKeys.has(wordKey);
    return !isDefaultWord &&
      (userCategoryNames.has(categoryKey) || ownCommunityCategoryNames.has(categoryKey) || defaultCategoryNames.has(categoryKey)) &&
      !blockedWordKeys.has(wordKey);
  });

  async function publishCategory(categoryName: string) {
    if (!categoryName) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const normalizedCategory = categoryName.trim().replace(/\s+/g, " ").toLowerCase();
    const found = await supabase.from("community_categories").select("id, status").eq("normalized_name", normalizedCategory).maybeSingle();
    if (found.error) { toast.error(found.error.message); return; }
    if (found.data) {
      if (found.data.status === "rejected") {
        const { data: updated, error } = await supabase.from("community_categories").update({ status: "pending", image_path: categories.find((item) => item.name === categoryName)?.image_path ?? null }).eq("id", found.data.id).eq("owner_id", user.id).eq("status", "rejected").select("id").maybeSingle();
        if (error) toast.error(error.message);
        else if (!updated) toast.info("This category is no longer available to resubmit. Refresh the page and try again.");
        else { setStatus("Your selected vocabulary has been sent to the admin for review."); toast.success("Category request sent again."); }
      } else toast.info(found.data.status === "published" ? "This category is already published." : found.data.status === "removed" ? "This category was removed and cannot be requested again." : "This category already has a review request.");
      return;
    }
    const { error } = await supabase.from("community_categories").insert({ owner_id: user.id, name: categoryName, color: categories.find((item) => item.name === categoryName)?.color ?? "blue", image_path: categories.find((item) => item.name === categoryName)?.image_path ?? null, status: "pending" });
    if (error) toast.error(error.code === "23505" ? "A request for this category already exists." : error.message);
    else { setStatus("Your selected vocabulary has been sent to the admin for review."); toast.success("Category request sent."); }
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
      const ownRejectedRequest = communityWordRequests.some((request) => request.id === previousRequestId && request.owner_id === user.id && request.status === "rejected");
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
    const categoryResult = await supabase.from("community_categories").select("id, owner_id, status").eq("normalized_name", normalizedCategory).maybeSingle();
    if (categoryResult.error) { toast.error(categoryResult.error.message); return; }
    let communityCategory = categoryResult.data;
    if (!communityCategory) {
      if (defaultCategoryNames.has(normalizedCategory)) {
        toast.error("This shared category is not available for word requests yet. Refresh the page and try again.");
        return;
      }
      const created = await supabase.from("community_categories").insert({ owner_id: user.id, name: word.category, color: categories.find((item) => item.name === word.category)?.color ?? "blue", image_path: categories.find((item) => item.name === word.category)?.image_path ?? null, status: "pending" }).select("id, owner_id, status").single();
      if (created.error) { toast.error(created.error.code === "23505" ? "This category already has a review request." : created.error.message); return; }
      communityCategory = created.data;
    }
    if (!communityCategory) { toast.error("Could not locate the category."); return; }
    if (communityCategory.status !== "published" && !(communityCategory.status === "pending" && communityCategory.owner_id === user.id)) { toast.error("Words can only be requested in your own or an approved category."); return; }
    const alreadyPublished = await supabase.from("community_words").select("id").eq("category_id", communityCategory.id).eq("normalized_word", normalizedWord).eq("status", "published").maybeSingle();
    if (alreadyPublished.error) { toast.error(alreadyPublished.error.message); return; }
    if (alreadyPublished.data) { toast.info(`“${word.word}” is already published in ${word.category}.`); return; }
    const previous = await supabase.from("community_words").select("id, status").eq("owner_id", user.id).eq("category_id", communityCategory.id).eq("normalized_word", normalizedWord).maybeSingle();
    if (previous.error) { toast.error(previous.error.message); return; }
    if (previous.data) {
      if (previous.data.status !== "rejected") {
        toast.info(previous.data.status === "removed" ? "This request was removed and cannot be sent again." : "This word already has a review request.");
        return;
      }
      const { data: updated, error } = await supabase.from("community_words").update({ word: word.word, meaning: word.meaning, ipa: word.ipa ?? null, status: "pending" }).eq("id", previous.data.id).eq("owner_id", user.id).eq("status", "rejected").select("id").maybeSingle();
      if (error) toast.error(error.message);
      else if (!updated) toast.info("This word is no longer available to resubmit. Refresh the page and try again.");
      else { setStatus("Your selected vocabulary has been sent to the admin for review."); toast.success("Word request sent again."); }
      return;
    }
    const { error } = await supabase.from("community_words").insert({ owner_id: user.id, category_id: communityCategory.id, source_vocabulary_word_id: word.id, word: word.word, meaning: word.meaning, ipa: word.ipa ?? null, image_path: null, status: "pending" });
    if (error) toast.error(error.code === "23505" ? `“${word.word}” already has a submission in this category.` : error.message);
    else { setStatus("Your selected vocabulary has been sent to the admin for review."); toast.success("Word request sent."); }
  }

  if (!isLoaded) return <p className="py-12 text-center text-slate-600">Checking your session…</p>;
  if (!isAuthenticated) return <p className="py-12 text-center text-slate-600">Sign in to submit vocabulary for publishing.</p>;

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

  async function refreshRequests() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    invalidatePublishRequestCache(user.id);
    try {
      const requests = await getCachedPublishRequests(user.id, loadPublishRequests, { force: true });
      setCommunityCategoryRequests(requests.categories);
      setCommunityWordRequests(requests.words);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh request status.");
    }
  }

  function toggleCategoryRequest(categoryName: string, checked: boolean) {
    const normalizedName = normalize(categoryName);
    setSelectedCategories((current) => checked
      ? current.includes(categoryName) ? current : [...current, categoryName]
      : current.filter((name) => name !== categoryName));
    const categoryWordIds = userWords.filter((word) => normalize(word.category) === normalizedName).map((word) => word.id);
    setSelectedWordIds((current) => checked
      ? [...new Set([...current, ...categoryWordIds])]
      : current.filter((id) => !categoryWordIds.includes(id)));
  }

  return <div className="publish-vocabulary-page">
    <header className="mb-6"><p className="text-sm font-semibold text-blue-600">Community vocabulary</p><h1 className="page-title mt-1">Send category or word requests</h1><p className="page-intro-description mt-2">Select multiple items to send requests together. Admins review them before they become visible to everyone, including guests.</p></header>
    {status && <AutoDismissMessage key={status} variant="success" className="mb-4">{status}</AutoDismissMessage>}
    <div className="publish-request-grid">
      <Card className="publish-request-card publish-category-card p-5 sm:p-6">
        <div className="publish-request-heading"><span className="publish-request-icon publish-category-icon"><FolderHeart size={29} /></span><div><h2>Category requests</h2><p>Selecting a category also selects its available words.</p></div><Sparkles className="publish-sparkle" size={22} /></div>
        <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {!requestsLoaded ? <p className="text-sm text-slate-500">Loading request status…</p> : requestableCategories.length ? requestableCategories.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={selectedCategories.includes(item.name)} onChange={(event) => toggleCategoryRequest(item.name, event.target.checked)} />
              <span>{item.name}</span>
              {communityCategoryRequests.some((request) => normalize(request.name) === normalize(item.name) && request.status === "rejected") && <span className="text-xs text-amber-700">Rejected · resubmittable</span>}
            </label>
          )) : <div className="publish-empty-state"><span className="publish-empty-illustration publish-folder-illustration">📁<span>⭐</span></span><h3>No categories ready to request.</h3><p>Custom categories you can submit for community approval will appear here.</p></div>}
        </div>
        <Button className="publish-send-button mt-4" onClick={() => void sendCategoryRequests()} disabled={!selectedCategories.length || busy}><Send size={16} /> {busy ? "Sending requests…" : "Send category requests"}</Button>
      </Card>
      <Card className="publish-request-card publish-word-card p-5 sm:p-6">
        <div className="publish-request-heading"><span className="publish-request-icon publish-word-icon"><BookOpen size={29} /></span><div><h2>Word requests</h2><p>Choose words you added to your own vocabulary, including words in default categories.</p></div><Sparkles className="publish-sparkle" size={22} /></div>
        <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
          {!requestsLoaded ? <p className="text-sm text-slate-500">Loading request status…</p> : userWords.length ? userWords.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={selectedWordIds.includes(item.id)} onChange={(event) => setSelectedWordIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
              <span>{item.word} <span className="text-slate-500">· {item.category}{item.meaning ? ` — ${item.meaning}` : ""}</span>
                {communityWordRequests.some((request) => request.status === "rejected" && communityCategoryNames.get(request.category_id) === normalize(item.category) && normalize(request.normalized_word) === normalize(item.word)) && <span className="ml-2 text-xs text-amber-700">Rejected · resubmittable</span>}
              </span>
            </label>
          )) : <div className="publish-empty-state"><span className="publish-empty-illustration publish-word-illustration">Aa<span>✦</span></span><h3>No words ready to request.</h3><p>Words from your vocabulary that are eligible for community approval will appear here.</p></div>}
        </div>
        <Button className="publish-send-button publish-word-send mt-4" onClick={() => void sendWordRequests()} disabled={!selectedWordIds.length || busy}><Send size={16} /> {busy ? "Sending requests…" : "Send word requests"}</Button>
      </Card>
    </div>
    <aside className="publish-request-note"><span>💡</span><p>You can request added words from your custom categories and the default categories.<br className="hidden sm:block" /> Only one English word can be published in a given category.</p></aside>
  </div>;
}
