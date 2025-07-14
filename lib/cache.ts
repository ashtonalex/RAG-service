import redis from './redis';
import { incrementMetric } from '@/lib/metrics';

/**
 * Get a cached value from Redis.
 * Logs whether it was a cache hit or miss and tracks metrics.
 */
export async function getCache(key: string): Promise<string | null> {
  try {
    const result = await redis.get(key);

    if (result) {
      console.log('✅ Cache hit:', key);
      incrementMetric('cacheHit');
      return result;
    } else {
      console.log('❌ Cache miss:', key);
      incrementMetric('cacheMiss');
      return result;
    }
  } catch (error) {
    console.error('⚠️ Redis get error:', error);
    return null;
  }
}

/**
 * Set a cache value in Redis with an optional TTL (default 1 hour).
 */
export async function setCache(key: string, value: string, ttl = 60 * 60): Promise<void> {
  try {
    await redis.set(key, value, 'EX', ttl);
  } catch (error) {
    console.error('⚠️ Redis set error:', error);
  }
}

/**
 * Invalidate/delete a cache entry from Redis.
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error('⚠️ Redis delete error:', error);
  }
}

