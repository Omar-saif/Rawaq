// In-memory rate limiting (Note: in serverless environments this is per-instance,
// so it is not a perfect global rate limit, but it provides basic hardening).
// For a production app, consider using @upstash/ratelimit with Redis.

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const limiters = new Map<string, RateLimitTracker>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let tracker = limiters.get(ip);
  
  if (!tracker || now > tracker.resetTime) {
    tracker = { count: 1, resetTime: now + windowMs };
    limiters.set(ip, tracker);
    return true;
  }
  
  if (tracker.count >= limit) {
    return false; // Rate limited
  }
  
  tracker.count++;
  limiters.set(ip, tracker);
  return true;
}
