import { supabase } from './client'

// Types for freelance services
export type ExperienceLevel = 'beginner' | 'intermediate' | 'expert'
export type PriceType = 'fixed' | 'hourly' | 'project'
export type AvailabilityStatus = 'available' | 'busy' | 'unavailable'

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  slug: string
}

export interface FreelanceService {
  id: string
  title: string
  description: string
  category_id: string
  category?: ServiceCategory
  seller_id: string
  seller_name?: string
  price: number
  price_type: PriceType
  experience_level: ExperienceLevel
  availability: AvailabilityStatus
  delivery_time?: string
  rating?: number
  reviews_count?: number
  image_url?: string
  created_at: string
  updated_at: string
}

// Fetch all freelance services
export const fetchFreelanceServices = async (): Promise<FreelanceService[]> => {
  try {
    const { data: services, error } = await supabase
      .from('freelance_services')
      .select('*')
      .eq('availability', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching freelance services:', error)
      // Return empty array if table doesn't exist yet
      if (error.code === '42P01') {
        return []
      }
      throw error
    }

    return services || []
  } catch (error) {
    console.error('Error in fetchFreelanceServices:', error)
    return []
  }
}

// Fetch freelance services by category
export const fetchFreelanceServicesByCategory = async (
  categoryId: string
): Promise<FreelanceService[]> => {
  try {
    const { data: services, error } = await supabase
      .from('freelance_services')
      .select('*')
      .eq('category_id', categoryId)
      .eq('availability', 'available')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services by category:', error)
      if (error.code === '42P01') {
        return []
      }
      throw error
    }

    return services || []
  } catch (error) {
    console.error('Error in fetchFreelanceServicesByCategory:', error)
    return []
  }
}

// Fetch single freelance service by ID
export const fetchFreelanceServiceById = async (
  serviceId: string
): Promise<FreelanceService | null> => {
  try {
    const { data: service, error } = await supabase
      .from('freelance_services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (error) {
      console.error('Error fetching service by id:', error)
      if (error.code === '42P01') {
        return null
      }
      throw error
    }

    return service
  } catch (error) {
    console.error('Error in fetchFreelanceServiceById:', error)
    return null
  }
}

// Get all service categories
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  try {
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching service categories:', error)
      if (error.code === '42P01') {
        return []
      }
      throw error
    }

    return categories || []
  } catch (error) {
    console.error('Error in getServiceCategories:', error)
    return []
  }
}

// Subscribe to freelance services updates
export const subscribeToFreelanceServices = (onUpdate: (payload: any) => void) => {
  const subscription = supabase
    .channel('freelance-services-channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'freelance_services',
      },
      onUpdate
    )
    .subscribe()

  return subscription
}
