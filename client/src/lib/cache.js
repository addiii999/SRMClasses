/**
 * Lightweight in-memory API cache.
 * Reduces duplicate Vercel edge requests for public data (branches, faculty, etc.)
 * Cache automatically expires after `ttlMs` milliseconds.
 */

const cache = new Map();

/**
 * Get data from cache if not expired, otherwise fetch from API.
 * @param {string} key - Unique cache key (e.g. '/branches', '/gallery-events')
 * @param {Function} fetchFn - Async function that fetches the data
 * @param {number} ttlMs - Time-to-live in ms (default 5 minutes)
 */
export async function cachedFetch(key, fetchFn, ttlMs = 5 * 60 * 1000) {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  const data = await fetchFn();
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/**
 * Manually invalidate a cache entry (e.g. after admin update)
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Clear all cached entries
 */
export function clearCache() {
  cache.clear();
}
