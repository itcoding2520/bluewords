export interface AdminReviewSubmission {
  id: string;
  owner_id: string;
  status: string;
  created_at: string;
  color?: string;
  name?: string;
  word?: string;
  meaning?: string;
  category_id?: string;
  category_name?: string;
  category_status?: string;
  image_path?: string | null;
  category_image_path?: string | null;
  category_color?: string;
}

export interface PublishedCategory {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  status: string;
  image_path: string | null;
}

export interface PublishedWord {
  id: string;
  owner_id: string;
  category_id: string;
  word: string;
  meaning: string;
  status: string;
  image_path: string | null;
}
