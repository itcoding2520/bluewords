const histories = new Map();
const answersBySession = new Map();

function historyKey(userId, page = 1, pageSize = 10) {
  return `${userId}:${page}:${pageSize}`;
}

export function getCachedQuizHistory(userId, page = 1, pageSize = 10) {
  return histories.get(historyKey(userId, page, pageSize)) ?? null;
}

export function setCachedQuizHistory(userId, page, pageSize, history) {
  histories.set(historyKey(userId, page, pageSize), history);
}

export function getCachedQuizAnswers(userId, sessionId) {
  return answersBySession.get(`${userId}:${sessionId}`) ?? null;
}

export function setCachedQuizAnswers(userId, sessionId, answers) {
  answersBySession.set(`${userId}:${sessionId}`, answers);
}

export function invalidateQuizHistoryCache(userId) {
  if (userId) {
    for (const key of histories.keys()) {
      if (key.startsWith(`${userId}:`)) histories.delete(key);
    }
    for (const key of answersBySession.keys()) {
      if (key.startsWith(`${userId}:`)) answersBySession.delete(key);
    }
    return;
  }

  histories.clear();
  answersBySession.clear();
}
