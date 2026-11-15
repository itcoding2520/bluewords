export interface CommunityCategoryRequest {
  id: string;
  owner_id: string;
  name: string;
  status: string;
}

export interface CommunityWordRequest {
  id: string;
  owner_id: string;
  category_id: string;
  normalized_word: string;
  word: string;
  meaning: string;
  ipa: string | null;
  category_name: string;
  status: string;
}
