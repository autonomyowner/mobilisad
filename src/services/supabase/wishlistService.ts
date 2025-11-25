import { supabase } from './client'

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

/**
 * Add a product to user's wishlist
 */
export const addToWishlist = async (productId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('wishlist')
      .insert({
        user_id: user.id,
        product_id: productId,
      })

    if (error) {
      // If it's a duplicate, consider it a success
      if (error.code === '23505') {
        return { success: true }
      }
      console.error('Error adding to wishlist:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error adding to wishlist:', err)
    return { success: false, error: 'Failed to add to wishlist' }
  }
}

/**
 * Remove a product from user's wishlist
 */
export const removeFromWishlist = async (productId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId)

    if (error) {
      console.error('Error removing from wishlist:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error removing from wishlist:', err)
    return { success: false, error: 'Failed to remove from wishlist' }
  }
}

/**
 * Toggle wishlist status for a product
 */
export const toggleWishlist = async (productId: string): Promise<{ success: boolean; isInWishlist: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, isInWishlist: false, error: 'User not authenticated' }
    }

    // Check if product is already in wishlist
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (existing) {
      // Remove from wishlist
      await removeFromWishlist(productId)
      return { success: true, isInWishlist: false }
    } else {
      // Add to wishlist
      await addToWishlist(productId)
      return { success: true, isInWishlist: true }
    }
  } catch (err) {
    console.error('Error toggling wishlist:', err)
    return { success: false, isInWishlist: false, error: 'Failed to toggle wishlist' }
  }
}

/**
 * Get user's wishlist product IDs
 */
export const getWishlistIds = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select('product_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching wishlist:', error)
      return []
    }

    return data?.map(item => item.product_id) || []
  } catch (err) {
    console.error('Error fetching wishlist:', err)
    return []
  }
}

/**
 * Check if a product is in user's wishlist
 */
export const isInWishlist = async (productId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking wishlist:', error)
      return false
    }

    return !!data
  } catch (err) {
    console.error('Error checking wishlist:', err)
    return false
  }
}

/**
 * Subscribe to wishlist changes
 */
export const subscribeToWishlist = (callback: (productIds: string[]) => void) => {
  const channel = supabase
    .channel('wishlist-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'wishlist',
      },
      async () => {
        const ids = await getWishlistIds()
        callback(ids)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}
