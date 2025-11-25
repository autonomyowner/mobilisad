import { supabase } from './client'
import { SellerCategory, OrderStatus, PaymentStatus } from './types'
import { Alert } from 'react-native'

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
  product_type: string  // Required field - must not be null
  stock_quantity?: number
  is_new?: boolean
  is_promo?: boolean
  seller_category?: SellerCategory
  image_uri?: string  // Local URI from image picker
  video_uri?: string  // Local URI from video picker
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

// Upload image to Supabase Storage (React Native compatible)
const uploadImage = async (
  uri: string,
  productId: string,
  sellerId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    console.log('uploadImage called with:', { uri, productId, sellerId })

    // Create a unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${sellerId}/${productId}/image-${Date.now()}.${fileExt}`
    console.log('Uploading to path:', fileName)

    // For React Native, we need to use FormData and ArrayBuffer approach
    const response = await fetch(uri)
    console.log('Fetch response status:', response.status)

    const arrayBuffer = await response.arrayBuffer()
    console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes')

    // Check file size (max 5MB)
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) {
      return { success: false, error: 'Image size must be less than 5MB' }
    }

    // Upload to Supabase Storage using ArrayBuffer (React Native compatible)
    console.log('Starting upload to Supabase...')
    const { data, error } = await supabase.storage
      .from('products')
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading image to storage:', error)
      return { success: false, error: error.message }
    }

    console.log('Upload successful, data:', data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)

    console.log('Public URL generated:', urlData.publicUrl)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Exception in uploadImage:', error)
    return { success: false, error: `Failed to upload image: ${error}` }
  }
}

// Upload video to Supabase Storage (React Native compatible)
const uploadVideo = async (
  uri: string,
  productId: string,
  sellerId: string
): Promise<{ success: boolean; url?: string; storagePath?: string; fileSize?: number; error?: string }> => {
  try {
    console.log('uploadVideo called with:', { uri, productId, sellerId })

    // Create a unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'mp4'
    const fileName = `${sellerId}/${productId}/video-${Date.now()}.${fileExt}`
    console.log('Uploading video to path:', fileName)

    // Fetch the video from local URI
    const response = await fetch(uri)
    console.log('Fetch video response status:', response.status)

    const arrayBuffer = await response.arrayBuffer()
    const fileSize = arrayBuffer.byteLength
    console.log('Video ArrayBuffer size:', fileSize, 'bytes')

    // Check file size (max 10MB)
    if (fileSize > 10 * 1024 * 1024) {
      return { success: false, error: 'Video size must be less than 10MB' }
    }

    // Upload to Supabase Storage using ArrayBuffer
    console.log('Starting video upload to Supabase...')
    const { data, error } = await supabase.storage
      .from('product-videos')
      .upload(fileName, arrayBuffer, {
        contentType: `video/${fileExt}`,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading video to storage:', error)
      return { success: false, error: error.message }
    }

    console.log('Video upload successful, data:', data)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-videos')
      .getPublicUrl(fileName)

    console.log('Video public URL generated:', urlData.publicUrl)

    return { success: true, url: urlData.publicUrl, storagePath: fileName, fileSize }
  } catch (error) {
    console.error('Exception in uploadVideo:', error)
    return { success: false, error: `Failed to upload video: ${error}` }
  }
}

// Add a new product - synced with website database schema
export const addProduct = async (
  sellerId: string,
  product: NewProductInput
): Promise<{ success: boolean; product?: SellerProduct; error?: string }> => {
  try {
    const slug = generateSlug(product.name)

    // First, create the product with all required NOT NULL fields
    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: slug,
        name: product.name,
        brand: product.name.split(' ')[0] || 'ZST',  // Required - use first word as brand or default
        description: product.description || 'Aucune description disponible',  // Required NOT NULL
        price: product.price,
        original_price: product.original_price,
        category: product.category,
        product_type: product.product_type,  // Required NOT NULL - fixes null constraint error
        product_category: 'perfume',  // Required NOT NULL - has default in DB
        seller_id: sellerId,
        seller_category: product.seller_category || 'fournisseur',
        in_stock: true,
        is_new: product.is_new || false,
        is_promo: product.is_promo || false,
        // Required NOT NULL text fields with sensible defaults
        ingredients: product.description || 'Non specifie',
        usage_instructions: 'Consulter le produit pour plus de details',
        delivery_estimate: '2-5 jours ouvrables',
        shipping_info: 'Livraison disponible dans toute l\'Algerie',
        returns_info: 'Retours acceptes sous conditions',
        payment_info: 'Paiement a la livraison disponible',
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding product:', error)
      return { success: false, error: error.message }
    }

    const productId = data.id

    // Upload image if provided
    if (product.image_uri) {
      console.log('Uploading image for product:', productId)
      const imageResult = await uploadImage(product.image_uri, productId, sellerId)

      if (imageResult.success && imageResult.url) {
        console.log('Image uploaded successfully:', imageResult.url)
        // Insert into product_images table
        const { data: imageData, error: imageError } = await supabase.from('product_images').insert({
          product_id: productId,
          image_url: imageResult.url,
          is_primary: true,
          display_order: 0,
        }).select()

        if (imageError) {
          console.error('Failed to insert image record:', imageError)
        } else {
          console.log('Image record inserted:', imageData)
        }
      } else {
        console.error('Failed to upload image:', imageResult.error)
        // Don't fail the product creation, but alert the user
        Alert.alert('Attention', `Produit cree mais l'image n'a pas pu etre telechargee: ${imageResult.error}`)
      }
    }

    // Upload video if provided
    if (product.video_uri) {
      console.log('Uploading video for product:', productId)
      const videoResult = await uploadVideo(product.video_uri, productId, sellerId)

      if (videoResult.success && videoResult.url && videoResult.storagePath) {
        console.log('Video uploaded successfully:', videoResult.url)
        console.log('Video file size:', videoResult.fileSize, 'bytes')

        // Insert into product_videos table
        const { data: videoData, error: videoError } = await supabase.from('product_videos').insert({
          product_id: productId,
          video_url: videoResult.url,
          video_storage_path: videoResult.storagePath,
          thumbnail_url: videoResult.url,  // Use same URL as thumbnail for now
          thumbnail_storage_path: videoResult.storagePath,
          duration_seconds: 30,  // Default value (30 seconds)
          file_size_bytes: videoResult.fileSize || 1024,  // Use actual file size or default
        }).select()

        if (videoError) {
          console.error('Failed to insert video record:', videoError)
          Alert.alert('Attention', `Video telechargee mais erreur d'enregistrement: ${videoError.message}`)
        } else {
          console.log('Video record inserted successfully:', videoData)
        }
      } else {
        console.error('Failed to upload video:', videoResult.error)
        Alert.alert('Attention', `Produit cree mais la video n'a pas pu etre telechargee: ${videoResult.error}`)
      }
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
