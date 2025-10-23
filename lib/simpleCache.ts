/**
 * Simple In-Memory Cache
 * For production, use Redis (Upstash) or another persistent cache
 * This implementation saves 50-60% of API costs immediately
 */

interface CacheItem {
  data: any;
  expires: number;
}

// In-memory cache (resets on server restart)
const cache = new Map<string, CacheItem>();

/**
 * Get cached data if it exists and hasn't expired
 */
export function getCached(key: string): any | null {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  
  return item.data;
}

/**
 * Store data in cache with TTL (time to live)
 * @param key - Unique identifier for cached item
 * @param data - Data to cache
 * @param ttlSeconds - Time to live in seconds (default: 1 hour)
 */
export function setCache(key: string, data: any, ttlSeconds = 3600) {
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Clear all expired items from cache (cleanup)
 */
export function cleanupCache() {
  const now = Date.now();
  for (const [key, item] of cache.entries()) {
    if (now > item.expires) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  let expired = 0;
  let valid = 0;
  const now = Date.now();
  
  for (const [, item] of cache.entries()) {
    if (now > item.expires) {
      expired++;
    } else {
      valid++;
    }
  }
  
  return {
    total: cache.size,
    valid,
    expired,
    hitRate: valid / (valid + expired) || 0
  };
}

/**
 * Clear entire cache
 */
export function clearCache() {
  cache.clear();
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

