/**
 * Simple In-Memory Cache Manager
 * Used for storing slow-changing data like Branches and Faculty
 * to reduce database hits in high-traffic production environments.
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  set(key, data, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiresAt });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheManager();
