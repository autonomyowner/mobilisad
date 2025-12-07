/**
 * Safe caching utility that prevents auth issues and stale data problems.
 *
 * Key principles:
 * 1. NEVER cache auth-related data
 * 2. Always return fresh data on error
 * 3. Cache expires automatically
 * 4. Cache can be manually invalidated
 * 5. Timeouts prevent infinite hangs
 */

import { load, save, remove } from "./storage"

// Helper to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`))
    }, ms)
    promise
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  version: string // To invalidate cache when app updates
}

// App version - increment this when you want to clear all caches
const CACHE_VERSION = "1.0.0"

/**
 * Safe cache configuration
 */
interface CacheConfig {
  /**
   * How long the cache is valid in milliseconds
   * @default 5 minutes
   */
  ttl?: number

  /**
   * Cache key prefix to avoid collisions
   * @default "cache"
   */
  prefix?: string

  /**
   * Timeout for fetch operations in milliseconds
   * @default 10 seconds
   */
  timeout?: number
}

/**
 * Get data from cache or fetch fresh data
 *
 * This is the SAFE way to cache:
 * - If cache is valid, return cached data
 * - If cache is expired or invalid, fetch fresh data
 * - If fetch fails, return cached data even if expired (offline support)
 * - If everything fails, return null
 *
 * @example
 * const products = await getCached(
 *   'products',
 *   () => fetchAllProducts(),
 *   { ttl: 5 * 60 * 1000 } // 5 minutes
 * )
 */
export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T | null> {
  const { ttl = 5 * 60 * 1000, prefix = "cache", timeout = 10000 } = config
  const cacheKey = `${prefix}:${key}`

  try {
    // Try to get cached data (with short timeout)
    let cached: CacheEntry<T> | null = null
    try {
      cached = await withTimeout(load<CacheEntry<T>>(cacheKey), 2000)
    } catch {
      // Cache read timed out, continue to fetch fresh
    }

    // Check if cache is valid
    const isCacheValid =
      cached &&
      cached.version === CACHE_VERSION &&
      Date.now() - cached.timestamp < ttl

    if (isCacheValid && cached) {
      console.log(`[Cache] Using cached data for: ${key}`)
      return cached.data
    }

    // Cache is invalid or expired, fetch fresh data with timeout
    console.log(`[Cache] Fetching fresh data for: ${key}`)
    const freshData = await withTimeout(fetchFn(), timeout)

    // Save to cache for next time (don't await, fire and forget)
    if (freshData) {
      save(cacheKey, {
        data: freshData,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      } as CacheEntry<T>).catch(() => {})
    }

    return freshData
  } catch (error) {
    console.error(`[Cache] Error fetching data for ${key}:`, error)

    // If fetch failed/timed out, try to return stale cache as fallback
    try {
      const cached = await withTimeout(load<CacheEntry<T>>(cacheKey), 1000)
      if (cached && cached.data) {
        console.log(`[Cache] Using stale cache as fallback for: ${key}`)
        return cached.data
      }
    } catch {
      // Stale cache also failed
    }

    // Everything failed, return null
    return null
  }
}

/**
 * Invalidate (delete) cache for a specific key
 *
 * Call this when:
 * - User creates a new product
 * - User updates data
 * - User logs out
 *
 * @example
 * await invalidateCache('products')
 */
export async function invalidateCache(key: string, prefix: string = "cache"): Promise<void> {
  const cacheKey = `${prefix}:${key}`
  console.log(`[Cache] Invalidating cache for: ${key}`)
  await remove(cacheKey)
}

/**
 * Invalidate multiple caches at once
 *
 * @example
 * await invalidateCaches(['products', 'categories', 'new-products'])
 */
export async function invalidateCaches(keys: string[], prefix: string = "cache"): Promise<void> {
  console.log(`[Cache] Invalidating ${keys.length} caches`)
  await Promise.all(keys.map((key) => invalidateCache(key, prefix)))
}

/**
 * Pre-cache data in the background
 *
 * Use this to cache data before the user needs it
 *
 * @example
 * // Pre-cache products on app launch
 * preCache('products', () => fetchAllProducts())
 */
export async function preCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  config: CacheConfig = {}
): Promise<void> {
  const { prefix = "cache" } = config
  const cacheKey = `${prefix}:${key}`

  try {
    const data = await fetchFn()
    if (data) {
      await save(cacheKey, {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      } as CacheEntry<T>)
      console.log(`[Cache] Pre-cached data for: ${key}`)
    }
  } catch (error) {
    console.error(`[Cache] Failed to pre-cache ${key}:`, error)
  }
}

/**
 * Check if cache exists and is valid
 */
export async function isCacheValid(
  key: string,
  ttl: number = 5 * 60 * 1000,
  prefix: string = "cache"
): Promise<boolean> {
  try {
    const cacheKey = `${prefix}:${key}`
    const cached = await load<CacheEntry<any>>(cacheKey)

    return !!(
      cached &&
      cached.version === CACHE_VERSION &&
      Date.now() - cached.timestamp < ttl
    )
  } catch {
    return false
  }
}
