const histories = new Map();
const answersBySession = new Map();

export function getCachedQuizHistory(userId) {
  return histories.get(userId) ?? null;
}

export function setCachedQuizHistory(userId, history) {
  histories.set(userId, history);
}

export function getCachedQuizAnswers(userId, sessionId) {
  return answersBySession.get(`${userId}:${sessionId}`) ?? null;
}

export function setCachedQuizAnswers(userId, sessionId, answers) {
  answersBySession.set(`${userId}:${sessionId}`, answers);
}

export function invalidateQuizHistoryCache(userId) {
  if (userId) {
    histories.delete(userId);
    for (const key of answersBySession.keys()) {
      if (key.startsWith(`${userId}:`)) answersBySession.delete(key);
    }
    return;
  }

  histories.clear();
  answersBySession.clear();
}
