# BlueWords starter vocabulary

All 18 starter category folders contain `words.csv` and an `images/` directory with matching image filenames: 25 source words and 25 images per category. `categories.csv` is the canonical category/color list; Vehicles is named Time, Body Parts is Body, and School Supplies is Supplies. The SQL seeder skips duplicate words case-insensitively, so users receive 436 unique words from the 450 source rows.

The earlier `20261019150000_seed_default_vocabulary_for_users.sql` migration contains a legacy 90-word pack. `20261019170000_seed_default_vocabulary_images_actions_animals_family_body.sql` adds the first four image-backed packs, and `20261019200000_seed_remaining_default_vocabulary_packs.sql` completes the dataset and replaces the signup seeder. New users receive the image-backed starter pack on signup. Existing accounts already using shared starter-image paths receive missing default data; accounts with only custom vocabulary are left unchanged.

Run `npm run upload:default-vocabulary-images` to upload the 14 remaining shared image packs (350 images); the first four packs (100 images) have already been uploaded. `.env.local` must contain `NEXT_PUBLIC_SUPABASE_URL` and the private `SUPABASE_SERVICE_ROLE_KEY`. Never commit the service-role key. The CSV files remain the source of truth for each pack and can also be used for manual review/import.
