import { supabase } from './client'
import { Product } from './types'

// Supabase storage base URL for relative image paths
const SUPABASE_STORAGE_URL = 'https://enbrhhuubjvapadqyvds.supabase.co/storage/v1/object/public/products'

// Extended product type with image and video
export interface ProductWithImage extends Product {
  image_url?: string
  video_url?: string
}

// Pagination result type for scalable product fetching
export interface PaginatedProducts {
  products: ProductWithImage[]
  totalCount: number
  hasMore: boolean
  nextPage: number
}

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20

// Helper function to check if image URL is valid (exists in storage)
const isValidImageUrl = (imageUrl: string | undefined): boolean => {
  if (!imageUrl) return false
  // Full URLs are valid
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return true
  }
  // Relative paths starting with /winter/ or /perfums/ are broken (not in storage)
  if (imageUrl.startsWith('/winter/') || imageUrl.startsWith('/perfums/')) {
    return false
  }
  return true
}

// Helper function to get full image URL
const getFullImageUrl = (imageUrl: string | undefined): string | undefined => {
  if (!imageUrl) return undefined
  // If it's already a full URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }
  // Convert relative path to full Supabase storage URL
  return `${SUPABASE_STORAGE_URL}${imageUrl}`
}

// Fetch all products (for marketplace/home page)
export const fetchAllProducts = async (): Promise<ProductWithImage[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      throw error
    }

    // Transform and filter out products with broken images
    return (products || [])
      .map(product => {
        const images = product.product_images as any[]
        const primaryImage = Array.isArray(images)
          ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
          : undefined

        const videos = product.product_videos as any[]
        const videoUrl = Array.isArray(videos) && videos.length > 0
          ? videos[0]?.video_url
          : undefined

        return {
          ...product,
          image_url: getFullImageUrl(primaryImage),
          video_url: videoUrl,
          product_images: undefined,
          product_videos: undefined,
          _hasValidImage: isValidImageUrl(primaryImage),
        }
      })
      .filter(product => (product as any)._hasValidImage) as ProductWithImage[]
  } catch (error) {
    console.error('Error in fetchAllProducts:', error)
    return []
  }
}

// Fetch new products (recently added)
export const fetchNewProducts = async (limit: number = 10): Promise<ProductWithImage[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('is_new', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching new products:', error)
      throw error
    }

    // Filter out products with broken images and apply limit
    return (products || [])
      .map(product => {
        const images = product.product_images as any[]
        const primaryImage = Array.isArray(images)
          ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
          : undefined

        const videos = product.product_videos as any[]
        const videoUrl = Array.isArray(videos) && videos.length > 0
          ? videos[0]?.video_url
          : undefined

        return {
          ...product,
          image_url: getFullImageUrl(primaryImage),
          video_url: videoUrl,
          product_images: undefined,
          product_videos: undefined,
          _hasValidImage: isValidImageUrl(primaryImage),
        }
      })
      .filter(product => (product as any)._hasValidImage)
      .slice(0, limit) as ProductWithImage[]
  } catch (error) {
    console.error('Error in fetchNewProducts:', error)
    return []
  }
}

// Fetch products on sale (promo)
export const fetchSaleProducts = async (limit: number = 10): Promise<ProductWithImage[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('is_promo', true)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sale products:', error)
      throw error
    }

    return (products || []).map(product => {
      const images = product.product_images as any[]
      const primaryImage = Array.isArray(images)
        ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
        : undefined

      const videos = product.product_videos as any[]
      const videoUrl = Array.isArray(videos) && videos.length > 0
        ? videos[0]?.video_url
        : undefined

      return {
        ...product,
        image_url: getFullImageUrl(primaryImage),
        video_url: videoUrl,
        product_images: undefined,
        product_videos: undefined,
      }
    }) as ProductWithImage[]
  } catch (error) {
    console.error('Error in fetchSaleProducts:', error)
    return []
  }
}

// Fetch products posted by fournisseurs (suppliers) for customers
export const fetchFournisseurProducts = async (limit: number = 20): Promise<ProductWithImage[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('seller_category', 'fournisseur')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching fournisseur products:', error)
      throw error
    }

    // Filter out products with broken image URLs and apply limit
    return (products || [])
      .map(product => {
        const images = product.product_images as any[]
        const primaryImage = Array.isArray(images)
          ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
          : undefined

        const videos = product.product_videos as any[]
        const videoUrl = Array.isArray(videos) && videos.length > 0
          ? videos[0]?.video_url
          : undefined

        return {
          ...product,
          image_url: getFullImageUrl(primaryImage),
          video_url: videoUrl,
          product_images: undefined,
          product_videos: undefined,
          _hasValidImage: isValidImageUrl(primaryImage),
        }
      })
      .filter(product => (product as any)._hasValidImage)
      .slice(0, limit) as ProductWithImage[]
  } catch (error) {
    console.error('Error in fetchFournisseurProducts:', error)
    return []
  }
}

// Fetch products by category
export const fetchProductsByCategory = async (
  category: string,
  limit: number = 20
): Promise<ProductWithImage[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }

    return (products || []).map(product => {
      const images = product.product_images as any[]
      const primaryImage = Array.isArray(images)
        ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
        : undefined

      const videos = product.product_videos as any[]
      const videoUrl = Array.isArray(videos) && videos.length > 0
        ? videos[0]?.video_url
        : undefined

      return {
        ...product,
        image_url: getFullImageUrl(primaryImage),
        video_url: videoUrl,
        product_images: undefined,
        product_videos: undefined,
      }
    }) as ProductWithImage[]
  } catch (error) {
    console.error('Error in fetchProductsByCategory:', error)
    return []
  }
}

// Get unique product categories
export const fetchProductCategories = async (): Promise<string[]> => {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('category')
      .eq('in_stock', true)

    if (error) {
      console.error('Error fetching categories:', error)
      throw error
    }

    // Get unique categories
    const categories = [...new Set((products || []).map(p => p.category))]
    return categories.filter(Boolean)
  } catch (error) {
    console.error('Error in fetchProductCategories:', error)
    return []
  }
}

// Subscribe to real-time product updates
export const subscribeToProducts = (onUpdate: (payload: any) => void) => {
  const subscription = supabase
    .channel('products-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products',
      },
      onUpdate
    )
    .subscribe()

  return subscription
}

// Helper function to transform product data
const transformProduct = (product: any): ProductWithImage & { _hasValidImage: boolean } => {
  const images = product.product_images as any[]
  const primaryImage = Array.isArray(images)
    ? images.find((img: any) => img.is_primary)?.image_url || images[0]?.image_url
    : undefined

  const videos = product.product_videos as any[]
  const videoUrl = Array.isArray(videos) && videos.length > 0
    ? videos[0]?.video_url
    : undefined

  return {
    ...product,
    image_url: getFullImageUrl(primaryImage),
    video_url: videoUrl,
    product_images: undefined,
    product_videos: undefined,
    _hasValidImage: isValidImageUrl(primaryImage),
  }
}

// ============================================
// PAGINATED FETCHING FUNCTIONS (SCALABLE)
// ============================================

// Fetch products with pagination (for infinite scroll)
export const fetchProductsPaginated = async (
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedProducts> => {
  try {
    const from = page * pageSize
    const to = from + pageSize - 1

    // Get total count first
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('in_stock', true)

    // Fetch paginated products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching paginated products:', error)
      throw error
    }

    const transformedProducts = (products || [])
      .map(transformProduct)
      .filter(product => product._hasValidImage) as ProductWithImage[]

    return {
      products: transformedProducts,
      totalCount: totalCount || 0,
      hasMore: (from + transformedProducts.length) < (totalCount || 0),
      nextPage: page + 1,
    }
  } catch (error) {
    console.error('Error in fetchProductsPaginated:', error)
    return { products: [], totalCount: 0, hasMore: false, nextPage: 0 }
  }
}

// Fetch fournisseur products with pagination (for customers)
export const fetchFournisseurProductsPaginated = async (
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedProducts> => {
  try {
    const from = page * pageSize
    const to = from + pageSize - 1

    // Get total count
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('in_stock', true)
      .eq('seller_category', 'fournisseur')

    // Fetch paginated products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('seller_category', 'fournisseur')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching paginated fournisseur products:', error)
      throw error
    }

    const transformedProducts = (products || [])
      .map(transformProduct)
      .filter(product => product._hasValidImage) as ProductWithImage[]

    return {
      products: transformedProducts,
      totalCount: totalCount || 0,
      hasMore: (from + transformedProducts.length) < (totalCount || 0),
      nextPage: page + 1,
    }
  } catch (error) {
    console.error('Error in fetchFournisseurProductsPaginated:', error)
    return { products: [], totalCount: 0, hasMore: false, nextPage: 0 }
  }
}

// Fetch products by category with pagination
export const fetchProductsByCategoryPaginated = async (
  category: string,
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedProducts> => {
  try {
    const from = page * pageSize
    const to = from + pageSize - 1

    // Get total count
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('in_stock', true)
      .eq('category', category)

    // Fetch paginated products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error fetching paginated category products:', error)
      throw error
    }

    const transformedProducts = (products || [])
      .map(transformProduct)
      .filter(product => product._hasValidImage) as ProductWithImage[]

    return {
      products: transformedProducts,
      totalCount: totalCount || 0,
      hasMore: (from + transformedProducts.length) < (totalCount || 0),
      nextPage: page + 1,
    }
  } catch (error) {
    console.error('Error in fetchProductsByCategoryPaginated:', error)
    return { products: [], totalCount: 0, hasMore: false, nextPage: 0 }
  }
}

// Search products with pagination
export const searchProductsPaginated = async (
  query: string,
  page: number = 0,
  pageSize: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedProducts> => {
  try {
    const from = page * pageSize
    const to = from + pageSize - 1
    const searchPattern = `%${query}%`

    // Get total count
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('in_stock', true)
      .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern},category.ilike.${searchPattern}`)

    // Fetch paginated products
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images(image_url, is_primary),
        product_videos(video_url)
      `)
      .eq('in_stock', true)
      .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern},category.ilike.${searchPattern}`)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      console.error('Error searching products:', error)
      throw error
    }

    const transformedProducts = (products || [])
      .map(transformProduct)
      .filter(product => product._hasValidImage) as ProductWithImage[]

    return {
      products: transformedProducts,
      totalCount: totalCount || 0,
      hasMore: (from + transformedProducts.length) < (totalCount || 0),
      nextPage: page + 1,
    }
  } catch (error) {
    console.error('Error in searchProductsPaginated:', error)
    return { products: [], totalCount: 0, hasMore: false, nextPage: 0 }
  }
}
