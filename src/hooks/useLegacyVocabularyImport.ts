"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { importLegacyVocabulary, previewVocabularyImport } from "@/lib/vocabulary-import";
import { getVocabularyWords } from "@/lib/supabase/vocabulary";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";
import type { VocabularyWord } from "@/data/vocabulary";

export function useLegacyVocabularyImport({
  isAdmin,
  refreshWords,
  refreshPage,
}: {
  isAdmin: boolean;
  refreshWords: () => Promise<unknown>;
  refreshPage: () => void;
}) {
  const confirmDialog = useConfirmDialog();
  const [legacyCloudWords, setLegacyCloudWords] = useState<VocabularyWord[]>([]);
  const [hasLegacyData, setHasLegacyData] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHasLegacyData(previewVocabularyImport([]).total > 0);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const importPreview = useMemo(() => {
    if (!hasLegacyData) return null;
    return previewVocabularyImport(legacyCloudWords);
  }, [hasLegacyData, legacyCloudWords]);

  const hasPendingImport = isAdmin && importPreview !== null && importPreview.ready.length > 0;

  async function togglePreview() {
    if (showImportPreview) {
      setShowImportPreview(false);
      return;
    }

    setShowImportPreview(true);
    try {
      const allWords = await getVocabularyWords();
      setLegacyCloudWords(allWords.map(mapVocabularyWordRow));
    } catch {
      toast.error("Failed to prepare the legacy vocabulary preview.");
    }
  }

  async function importVocabulary() {
    if (isImporting || !importPreview || importPreview.ready.length === 0) return;

    const confirmed = await confirmDialog({
      title: "Import vocabulary?",
      description: `Import ${importPreview.ready.length} words into your account? Your old localStorage data will be kept.`,
      confirmLabel: "Import words",
      destructive: false,
    });
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const result = await importLegacyVocabulary(legacyCloudWords);
      await refreshWords();
      refreshPage();

      if (result.failed === 0) setShowImportPreview(false);
      if (result.imported > 0) toast.success(`Imported ${result.imported} words successfully!`);
      if (result.duplicates > 0) toast.info(`Skipped ${result.duplicates} duplicate words.`);
      if (result.failed > 0) toast.error(`${result.failed} words could not be imported.`);
    } catch (error) {
      console.error("Vocabulary import error:", error);
      toast.error("Failed to import vocabulary.");
    } finally {
      setIsImporting(false);
    }
  }

  return {
    hasPendingImport,
    importPreview,
    isImporting,
    showImportPreview,
    togglePreview,
    importVocabulary,
  };
}
