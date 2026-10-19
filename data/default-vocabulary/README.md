# BlueWords starter vocabulary

This starter set contains 18 category definitions and 90 beginner-level words (5 per category), split into two import batches of 45 unique words each to stay under the app's 50-word import limit.

## Import order

1. Create the 18 categories from `categories.csv` in **Vocabulary → Manage categories**. The current vocabulary CSV importer does not create categories; unknown categories are intentionally moved to `Uncategorized`.
2. Import `words-01.csv` and then `words-02.csv` from the Vocabulary import tool.
3. IPA cells are blank intentionally. The app will attempt to fetch IPA for each entry with `type=word`; a failed dictionary lookup does not block import.

The starter entries are marked `learning`. The numbered entries leave `part_of_speech` blank because the current part-of-speech options do not include “numeral”.
