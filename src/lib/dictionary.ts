interface DictionaryPhonetic {
  text?: string;
}

interface DictionaryEntry {
  phonetic?: string;
  phonetics?: DictionaryPhonetic[];
}

function normalizeIpa(phonetic: string): string | null {
  const value = phonetic.trim().replace(/^\/+|\/+$/g, "").trim();
  return value ? `/${value}/` : null;
}

/** Best-effort IPA lookup. Dictionary API misses should never block saving vocabulary. */
export async function fetchEnglishIpa(word: string): Promise<string | null> {
  const normalizedWord = word.trim();
  if (!normalizedWord || !/^[a-z]+(?:[ '-][a-z]+)*$/i.test(normalizedWord)) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
      { signal: AbortSignal.timeout(4000) }
    );

    if (!response.ok) return null;

    const entries = (await response.json()) as DictionaryEntry[];
    for (const entry of entries) {
      const phonetic = [entry.phonetic, ...(entry.phonetics ?? []).map((item) => item.text)]
        .find((item) => typeof item === "string" && item.trim());

      if (phonetic) return normalizeIpa(phonetic);
    }
  } catch {
    // Network errors, timeouts, or API failures are intentionally non-fatal.
  }

  return null;
}
