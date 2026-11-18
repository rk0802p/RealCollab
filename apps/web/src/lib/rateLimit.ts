/**
 * Production-ready in-memory sliding window rate limiter.
 * Protects auth and sensitive API endpoints against brute force and abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  limit: number;       // Maximum allowed requests
  windowMs: number;    // Window duration in milliseconds
  keyPrefix?: string;  // Namespace for different endpoints
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;       // Unix timestamp (ms) when window resets
  retryAfterSeconds: number;
}

// In-memory store: Map<key, RateLimitRecord>
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 60 seconds
let lastCleanup = Date.now();
function cleanupExpiredRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;

  rateLimitStore.forEach((record, key) => {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  });
}

/**
 * Extracts client IP identifier from incoming request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Checks whether an incoming request exceeds the configured rate limit.
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowMs, keyPrefix = 'default' } = options;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  cleanupExpiredRecords(windowMs);

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
      retryAfterSeconds: retryAfter,
    };
  }

  // Add current request timestamp
  record.timestamps.push(now);
  const resetTime = now + windowMs;

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    reset: resetTime,
    retryAfterSeconds: 0,
  };
}

/**
 * Generates standard rate limit headers for HTTP responses.
 */
export function getRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
  };

  if (!result.success) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Helper for tests to clear the in-memory store.
 */
export function resetRateLimitStore() {
  rateLimitStore.clear();
}
