// Database types for Supabase - synced with website database schema

export type UserRole = 'customer' | 'seller' | 'admin' | 'freelancer'
export type SellerType = 'retailer' | 'importer' | 'wholesaler'
export type SellerCategory = 'fournisseur' | 'importateur' | 'grossiste'
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  bio?: string
  role: UserRole
  seller_type?: SellerType
  seller_category?: SellerCategory
  provider_name?: string
  provider_avatar?: string
  is_demo_user?: boolean
  push_token?: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  description?: string
  price: number
  original_price?: number
  category: string
  product_type?: string
  product_category?: 'perfume' | 'clothing'
  need?: string
  seller_id?: string
  seller_category?: SellerCategory
  in_stock: boolean
  is_new?: boolean
  is_promo?: boolean
  rating?: number
  viewers_count?: number
  countdown_end_date?: string
  benefits?: string[]
  ingredients?: string
  usage_instructions?: string
  delivery_estimate?: string
  shipping_info?: string
  returns_info?: string
  payment_info?: string
  exclusive_offers?: string
  created_at: string
  updated_at: string
}

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

export interface Order {
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

export interface OrderItem {
  id: string
  order_id: string
  product_id?: string
  product_name: string
  product_image: string
  quantity: number
  price: number
  subtotal: number
  created_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

// Database schema type for Supabase client
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      cart_items: {
        Row: CartItem
        Insert: Omit<CartItem, 'id' | 'created_at'>
        Update: Partial<Omit<CartItem, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      seller_type: SellerType
      seller_category: SellerCategory
    }
  }
}
