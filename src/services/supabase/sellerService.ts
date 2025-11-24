import { supabase } from './client'
import { SellerCategory, OrderStatus, PaymentStatus } from './types'

// Seller stats type
export interface SellerStats {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

// Seller order type - matches website database schema
export interface SellerOrder {
  id: string
  order_number: string
  user_id?: string
  seller_id?: string
  customer_name: string
  customer_email?: string
  customer_phone: string
  customer_address: string
  customer_wilaya: string
  total: number
  status: OrderStatus
  payment_status: PaymentStatus
  delivery_date?: string
  tracking_number?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Seller product type
export interface SellerProduct {
  id: string
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  in_stock: boolean
  stock_quantity?: number
  is_new?: boolean
  is_promo?: boolean
  created_at: string
  image_url?: string
}

// New product input type
export interface NewProductInput {
  name: string
  description?: string
  price: number
  original_price?: number
  category: string
  stock_quantity?: number
  is_new?: boolean
  is_promo?: boolean
  seller_category?: SellerCategory
}

// Fetch seller statistics - synced with website database
export const fetchSellerStats = async (sellerId: string): Promise<SellerStats> => {
  try {
    // Get total products for this seller
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)

    // Get orders for this seller
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total')
      .eq('seller_id', sellerId)

    const totalOrders = orders?.length || 0
    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
    const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0

    return {
      totalProducts: productsCount || 0,
      totalOrders,
      totalRevenue,
      pendingOrders,
    }
  } catch (error) {
    console.error('Error fetching seller stats:', error)
    return {
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
    }
  }
}

// Fetch seller's recent orders - filtered by seller_id
export const fetchSellerRecentOrders = async (
  sellerId: string,
  limit: number = 5
): Promise<SellerOrder[]> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching seller orders:', error)
      throw error
    }

    return orders || []
  } catch (error) {
    console.error('Error in fetchSellerRecentOrders:', error)
    return []
  }
}

// Fetch all seller orders - filtered by seller_id
export const fetchSellerOrders = async (sellerId: string): Promise<SellerOrder[]> => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching seller orders:', error)
      throw error
    }

    return orders || []
  } catch (error) {
    console.error('Error in fetchSellerOrders:', error)
    return []
  }
}

// Fetch seller's products
export const fetchSellerProducts = async (sellerId: string): Promise<SellerProduct[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching seller products:', error)
      throw error
    }

    return products || []
  } catch (error) {
    console.error('Error in fetchSellerProducts:', error)
    return []
  }
}

// Subscribe to seller orders updates
export const subscribeToSellerOrders = (sellerId: string, onUpdate: (payload: any) => void) => {
  const subscription = supabase
    .channel(`seller-orders-${sellerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      onUpdate
    )
    .subscribe()

  return subscription
}

// Subscribe to seller products updates
export const subscribeToSellerProducts = (sellerId: string, onUpdate: (payload: any) => void) => {
  const subscription = supabase
    .channel(`seller-products-${sellerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
        filter: `seller_id=eq.${sellerId}`,
      },
      onUpdate
    )
    .subscribe()

  return subscription
}

// Generate product slug from name
const generateSlug = (name: string): string => {
  const timestamp = Date.now().toString(36)
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${timestamp}`
}

// Add a new product - synced with website database schema
export const addProduct = async (
  sellerId: string,
  product: NewProductInput
): Promise<{ success: boolean; product?: SellerProduct; error?: string }> => {
  try {
    const slug = generateSlug(product.name)

    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: slug,
        name: product.name,
        brand: product.name.split(' ')[0] || 'ZST',  // Use first word as brand or default
        description: product.description || '',
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        seller_id: sellerId,
        seller_category: product.seller_category || 'fournisseur',  // Correct default from database enum
        in_stock: true,
        is_new: product.is_new || false,
        is_promo: product.is_promo || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding product:', error)
      return { success: false, error: error.message }
    }

    return { success: true, product: data }
  } catch (error) {
    console.error('Error in addProduct:', error)
    return { success: false, error: 'Failed to add product' }
  }
}

// Update a product
export const updateProduct = async (
  productId: string,
  sellerId: string,
  updates: Partial<NewProductInput>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('seller_id', sellerId)

    if (error) {
      console.error('Error updating product:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateProduct:', error)
    return { success: false, error: 'Failed to update product' }
  }
}

// Delete a product
export const deleteProduct = async (
  productId: string,
  sellerId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('seller_id', sellerId)

    if (error) {
      console.error('Error deleting product:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteProduct:', error)
    return { success: false, error: 'Failed to delete product' }
  }
}

// Toggle product stock status
export const toggleProductStock = async (
  productId: string,
  sellerId: string,
  inStock: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('products')
      .update({ in_stock: inStock, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('seller_id', sellerId)

    if (error) {
      console.error('Error toggling product stock:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in toggleProductStock:', error)
    return { success: false, error: 'Failed to update stock status' }
  }
}

// Update order status (processing, ship, deliver, cancel) - synced with website database
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateOrderStatus:', error)
    return { success: false, error: 'Failed to update order status' }
  }
}

// Fetch order details with items - synced with website database
export const fetchOrderDetails = async (orderId: string): Promise<{
  order: SellerOrder | null
  items: Array<{
    id: string
    product_name: string
    product_image: string
    quantity: number
    price: number
    subtotal: number
  }>
}> => {
  try {
    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError)
      return { order: null, items: [] }
    }

    // Get order items - order_items table has product_name, product_image, price, subtotal
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return { order, items: [] }
    }

    const formattedItems = (items || []).map(item => ({
      id: item.id,
      product_name: item.product_name || 'Unknown Product',
      product_image: item.product_image || '',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal,
    }))

    return { order, items: formattedItems }
  } catch (error) {
    console.error('Error in fetchOrderDetails:', error)
    return { order: null, items: [] }
  }
}

// Get product categories for dropdown
export const getProductCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')

    if (error) {
      console.error('Error fetching categories:', error)
      return ['Vetements', 'Accessoires', 'Electronique', 'Autre']
    }

    const categories = [...new Set((data || []).map(p => p.category).filter(Boolean))]
    return categories.length > 0 ? categories : ['Vetements', 'Accessoires', 'Electronique', 'Autre']
  } catch (error) {
    console.error('Error in getProductCategories:', error)
    return ['Vetements', 'Accessoires', 'Electronique', 'Autre']
  }
}
