const COMMUNITY_CATEGORY_ID_PREFIX = "community-category-";

export function createCommunityCategoryId(id: string): string {
  return `${COMMUNITY_CATEGORY_ID_PREFIX}${id}`;
}

export function isCommunityCategoryId(id: string): boolean {
  return id.startsWith(COMMUNITY_CATEGORY_ID_PREFIX);
}

export function getCommunityCategoryId(id: string): string | null {
  return isCommunityCategoryId(id)
    ? id.slice(COMMUNITY_CATEGORY_ID_PREFIX.length)
    : null;
}
