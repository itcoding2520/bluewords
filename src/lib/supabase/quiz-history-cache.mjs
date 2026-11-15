import { createUserPageCache } from "./user-page-cache.mjs";

const answersBySession = new Map();
const historyPages = createUserPageCache();

export function getCachedQuizHistory(userId, page = 1, pageSize = 10) {
  return historyPages.get(userId, page, pageSize);
}

export function setCachedQuizHistory(userId, page, pageSize, history) {
  historyPages.set(userId, page, pageSize, history);
}

export function getCachedQuizAnswers(userId, sessionId) {
  return answersBySession.get(`${userId}:${sessionId}`) ?? null;
}

export function setCachedQuizAnswers(userId, sessionId, answers) {
  answersBySession.set(`${userId}:${sessionId}`, answers);
}

export function invalidateQuizHistoryCache(userId) {
  if (userId) {
    historyPages.invalidate(userId);
    for (const key of answersBySession.keys()) {
      if (key.startsWith(`${userId}:`)) answersBySession.delete(key);
    }
    return;
  }

  historyPages.invalidate();
  answersBySession.clear();
}
