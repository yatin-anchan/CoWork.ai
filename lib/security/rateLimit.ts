const requestMap = new Map<string, number>();

export function checkRateLimit(userId: string) {
  const now = Date.now();
  const last = requestMap.get(userId) || 0;

  if (now - last < 2000) {
    throw new Error("Too many requests. Slow down.");
  }

  requestMap.set(userId, now);
}