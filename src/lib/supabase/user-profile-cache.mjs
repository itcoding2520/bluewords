const profilesByUser = new Map();

export function getCachedUserProfile(userId) {
  return profilesByUser.has(userId) ? profilesByUser.get(userId) : undefined;
}

export function setCachedUserProfile(userId, profile) {
  profilesByUser.set(userId, profile);
}

export function clearCachedUserProfile(userId) {
  if (userId === undefined) profilesByUser.clear();
  else profilesByUser.delete(userId);
}
