/**
 * Cached seller service - SAFE version for seller dashboard data
 *
 * This wraps the original sellerService with intelligent caching.
 * Seller data changes less frequently than public products.
 */

import { getCached, invalidateCache, invalidateCaches } from "@/utils/safeCache"

import {
  fetchSellerStats as fetchSellerStatsOriginal,
  fetchSellerRecentOrders as fetchSellerRecentOrdersOriginal,
  fetchSellerProducts as fetchSellerProductsOriginal,
  fetchSellerOrders as fetchSellerOrdersOriginal,
  subscribeToSellerOrders,
  subscribeToSellerProducts,
  updateOrderStatus,
  deleteProduct,
  addProduct,
  SellerStats,
  SellerOrder,
  SellerProduct,
  NewProductInput,
} from "./sellerService"
import { OrderStatus } from "./types"

// Cache durations (in milliseconds)
const CACHE_DURATIONS = {
  SELLER_STATS: 2 * 60 * 1000, // 2 minutes - stats change frequently
  SELLER_ORDERS: 1 * 60 * 1000, // 1 minute - orders are time-sensitive
  SELLER_PRODUCTS: 5 * 60 * 1000, // 5 minutes - products change less often
}

/**
 * Fetch seller statistics with caching
 *
 * - Cached for 2 minutes
 * - On error, returns stale cache or default stats
 */
export const fetchSellerStats = async (sellerId: string): Promise<SellerStats> => {
  const cached = await getCached(
    `seller:stats:${sellerId}`,
    () => fetchSellerStatsOriginal(sellerId),
    { ttl: CACHE_DURATIONS.SELLER_STATS }
  )

  // Fallback to zero stats if cache failed
  return cached ?? {
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  }
}

/**
 * Fetch recent seller orders with caching
 */
export const fetchSellerRecentOrders = async (
  sellerId: string,
  limit: number = 5
): Promise<SellerOrder[]> => {
  const cached = await getCached(
    `seller:orders:recent:${sellerId}:${limit}`,
    () => fetchSellerRecentOrdersOriginal(sellerId, limit),
    { ttl: CACHE_DURATIONS.SELLER_ORDERS }
  )

  return cached ?? []
}

/**
 * Fetch all seller orders with caching
 */
export const fetchSellerOrders = async (sellerId: string): Promise<SellerOrder[]> => {
  const cached = await getCached(
    `seller:orders:all:${sellerId}`,
    () => fetchSellerOrdersOriginal(sellerId),
    { ttl: CACHE_DURATIONS.SELLER_ORDERS }
  )

  return cached ?? []
}

/**
 * Fetch seller products with caching
 */
export const fetchSellerProducts = async (sellerId: string): Promise<SellerProduct[]> => {
  const cached = await getCached(
    `seller:products:${sellerId}`,
    () => fetchSellerProductsOriginal(sellerId),
    { ttl: CACHE_DURATIONS.SELLER_PRODUCTS }
  )

  return cached ?? []
}

/**
 * Update order status and invalidate cache
 *
 * This is NOT cached - it's a mutation operation.
 * After update, it invalidates relevant caches.
 */
export const updateOrderStatusWithCache = async (
  orderId: string,
  status: OrderStatus,
  sellerId: string
): Promise<{ success: boolean; error?: string }> => {
  const result = await updateOrderStatus(orderId, status)

  if (result.success) {
    // Invalidate seller caches after order update
    await invalidateSellerCaches(sellerId)
  }

  return result
}

/**
 * Delete product and invalidate cache
 *
 * This is NOT cached - it's a mutation operation.
 * After delete, it invalidates relevant caches.
 */
export const deleteProductWithCache = async (
  productId: string,
  sellerId: string
): Promise<{ success: boolean; error?: string }> => {
  const result = await deleteProduct(productId, sellerId)

  if (result.success) {
    // Invalidate seller and product caches after delete
    await invalidateSellerCaches(sellerId)
  }

  return result
}

/**
 * Add new product and invalidate cache
 *
 * This is NOT cached - it's a mutation operation.
 * After add, it invalidates relevant caches.
 */
export const addProductWithCache = async (
  sellerId: string,
  productData: NewProductInput
): Promise<{ success: boolean; product?: SellerProduct; error?: string }> => {
  const result = await addProduct(sellerId, productData)

  if (result.success) {
    // Invalidate seller and product caches after add
    await invalidateSellerCaches(sellerId)
  }

  return result
}

/**
 * Invalidate all seller-related caches
 *
 * Call this when:
 * - Seller updates an order
 * - Seller adds/deletes a product
 * - You want to force refresh seller data
 *
 * @example
 * await invalidateSellerCaches(user.id)
 */
export const invalidateSellerCaches = async (sellerId: string): Promise<void> => {
  await invalidateCaches([
    `seller:stats:${sellerId}`,
    `seller:orders:recent:${sellerId}:5`,
    `seller:orders:all:${sellerId}`,
    `seller:products:${sellerId}`,
  ])
}

/**
 * Subscribe to real-time seller orders and auto-invalidate cache
 *
 * This is SAFE because:
 * - It only invalidates cache, doesn't store subscription data
 * - When cache is invalidated, next fetch gets fresh data
 *
 * @example
 * const subscription = subscribeToSellerOrdersWithCache(userId)
 * // Later, to unsubscribe:
 * subscription.unsubscribe()
 */
export const subscribeToSellerOrdersWithCache = (sellerId: string) => {
  return subscribeToSellerOrders(sellerId, async (payload) => {
    console.log("[Cache] Seller order updated, invalidating cache:", payload)
    // Invalidate cache when orders change
    await invalidateSellerCaches(sellerId)
  })
}

/**
 * Subscribe to real-time seller products and auto-invalidate cache
 */
export const subscribeToSellerProductsWithCache = (sellerId: string) => {
  return subscribeToSellerProducts(sellerId, async (payload) => {
    console.log("[Cache] Seller product updated, invalidating cache:", payload)
    // Invalidate cache when products change
    await invalidateSellerCaches(sellerId)
  })
}

// Re-export original functions for direct access if needed
export {
  subscribeToSellerOrders,
  subscribeToSellerProducts,
  updateOrderStatus,
  deleteProduct,
  addProduct,
}

// Re-export types
export type { SellerStats, SellerOrder, SellerProduct, NewProductInput }
