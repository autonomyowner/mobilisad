import { supabase } from './client'
import { ProductWithImage } from './productService'

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  product_name: string
  product_image?: string
  product_price: number
  quantity: number
  created_at: string
  updated_at: string
}

export interface CartItemWithProduct extends CartItem {
  product?: ProductWithImage
}

/**
 * Get all cart items for the current user
 */
export const getCartItems = async (): Promise<CartItem[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cart items:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Error fetching cart items:', err)
    return []
  }
}

/**
 * Add a product to the cart
 */
export const addToCart = async (
  product: ProductWithImage,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    // Check if product already exists in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .single()

    if (existing) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({
          quantity: existing.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (error) {
        console.error('Error updating cart item:', error)
        return { success: false, error: error.message }
      }
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          product_price: product.price,
          quantity,
        })

      if (error) {
        console.error('Error adding to cart:', error)
        return { success: false, error: error.message }
      }
    }

    return { success: true }
  } catch (err) {
    console.error('Error adding to cart:', err)
    return { success: false, error: 'Failed to add to cart' }
  }
}

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (
  cartItemId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (quantity <= 0) {
      return removeFromCart(cartItemId)
    }

    const { error } = await supabase
      .from('cart_items')
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cartItemId)

    if (error) {
      console.error('Error updating cart item:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error updating cart item:', err)
    return { success: false, error: 'Failed to update cart item' }
  }
}

/**
 * Remove an item from the cart
 */
export const removeFromCart = async (cartItemId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)

    if (error) {
      console.error('Error removing from cart:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error removing from cart:', err)
    return { success: false, error: 'Failed to remove from cart' }
  }
}

/**
 * Clear all items from the cart
 */
export const clearCart = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('Error clearing cart:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error clearing cart:', err)
    return { success: false, error: 'Failed to clear cart' }
  }
}

/**
 * Get cart item count
 */
export const getCartItemCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return 0
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching cart count:', error)
      return 0
    }

    return data?.reduce((total, item) => total + item.quantity, 0) || 0
  } catch (err) {
    console.error('Error fetching cart count:', err)
    return 0
  }
}

/**
 * Get cart total price
 */
export const getCartTotal = async (): Promise<number> => {
  try {
    const items = await getCartItems()
    return items.reduce((total, item) => total + (item.product_price * item.quantity), 0)
  } catch (err) {
    console.error('Error calculating cart total:', err)
    return 0
  }
}

/**
 * Subscribe to cart changes
 */
export const subscribeToCart = (callback: (items: CartItem[]) => void) => {
  const channel = supabase
    .channel('cart-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cart_items',
      },
      async () => {
        const items = await getCartItems()
        callback(items)
      }
    )
    .subscribe()

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel)
    },
  }
}
