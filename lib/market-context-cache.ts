/**
 * Simple in-memory cache for market context
 * 
 * In production, you'd want to use Redis or a database for persistence
 * This is a simple implementation for MVP
 */

interface CachedContext {
  context: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

const cache = new Map<string, CachedContext>();
const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached context for a market
 */
export function getCachedContext(marketId: string): any | null {
  const cached = cache.get(marketId);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(marketId);
    return null;
  }
  
  return cached.context;
}

/**
 * Set cached context for a market
 */
export function setCachedContext(marketId: string, context: any, ttl: number = DEFAULT_TTL): void {
  cache.set(marketId, {
    context,
    timestamp: Date.now(),
    ttl,
  });
}

/**
 * Clear cache for a specific market
 */
export function clearCache(marketId: string): void {
  cache.delete(marketId);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  cache.clear();
}

