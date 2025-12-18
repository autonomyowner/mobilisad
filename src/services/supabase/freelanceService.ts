import { supabase } from "./client"

// Types matching the actual database schema
export type ExperienceLevel = "Débutant" | "Intermédiaire" | "Expert"
export type PriceType = "fixed" | "hourly" | "starting-at"
export type AvailabilityStatus = "available" | "busy" | "unavailable"
export type ServiceCategory =
  | "Développement Web"
  | "Design Graphique"
  | "Montage Vidéo"
  | "Marketing Digital"
  | "Rédaction"
  | "Photographie"
  | "Traduction"
  | "Consultation"

// All available categories as an array for filtering UI
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Développement Web",
  "Design Graphique",
  "Montage Vidéo",
  "Marketing Digital",
  "Rédaction",
  "Photographie",
  "Traduction",
  "Consultation",
]

export interface FreelanceService {
  id: string
  slug: string
  provider_id: string
  service_title: string
  category: ServiceCategory
  experience_level: ExperienceLevel
  rating: number
  reviews_count: number
  completed_projects: number
  response_time: string
  price: number
  price_type: PriceType
  description: string
  short_description: string
  skills: string[]
  delivery_time: string
  revisions: string
  languages: string[]
  availability: AvailabilityStatus
  featured: boolean
  verified: boolean
  top_rated: boolean
  video_url?: string
  created_at: string
  updated_at: string
  // Joined data
  provider?: {
    id: string
    full_name: string
    provider_avatar?: string
  }
}

// Fetch all freelance services
export const fetchFreelanceServices = async (): Promise<FreelanceService[]> => {
  try {
    const { data: services, error } = await supabase
      .from("freelance_services")
      .select(
        `
        *,
        provider:user_profiles!freelance_services_provider_id_fkey(id, full_name, provider_avatar)
      `
      )
      .eq("availability", "available")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching freelance services:", error)
      if (error.code === "42P01") {
        return []
      }
      throw error
    }

    return services || []
  } catch (error) {
    console.error("Error in fetchFreelanceServices:", error)
    return []
  }
}

// Fetch freelance services by category
export const fetchFreelanceServicesByCategory = async (
  category: ServiceCategory
): Promise<FreelanceService[]> => {
  try {
    const { data: services, error } = await supabase
      .from("freelance_services")
      .select(
        `
        *,
        provider:user_profiles!freelance_services_provider_id_fkey(id, full_name, provider_avatar)
      `
      )
      .eq("category", category)
      .eq("availability", "available")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching services by category:", error)
      if (error.code === "42P01") {
        return []
      }
      throw error
    }

    return services || []
  } catch (error) {
    console.error("Error in fetchFreelanceServicesByCategory:", error)
    return []
  }
}

// Fetch single freelance service by ID
export const fetchFreelanceServiceById = async (
  serviceId: string
): Promise<FreelanceService | null> => {
  try {
    const { data: service, error } = await supabase
      .from("freelance_services")
      .select(
        `
        *,
        provider:user_profiles!freelance_services_provider_id_fkey(id, full_name, provider_avatar)
      `
      )
      .eq("id", serviceId)
      .single()

    if (error) {
      console.error("Error fetching service by id:", error)
      if (error.code === "42P01") {
        return null
      }
      throw error
    }

    return service
  } catch (error) {
    console.error("Error in fetchFreelanceServiceById:", error)
    return null
  }
}

// Get all service categories (returns the static enum array)
export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  return SERVICE_CATEGORIES
}

// Subscribe to freelance services updates
export const subscribeToFreelanceServices = (onUpdate: (payload: unknown) => void) => {
  const subscription = supabase
    .channel("freelance-services-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "freelance_services",
      },
      onUpdate
    )
    .subscribe()

  return subscription
}

// Delete a freelance service by ID
export const deleteFreelanceService = async (
  serviceId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("freelance_services")
      .delete()
      .eq("id", serviceId)

    if (error) {
      console.error("Error deleting freelance service:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in deleteFreelanceService:", error)
    return { success: false, error: "Failed to delete service" }
  }
}

// Delete a freelance service by title (for cleanup)
export const deleteFreelanceServiceByTitle = async (
  titlePattern: string
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  try {
    // First find matching services
    const { data: services, error: fetchError } = await supabase
      .from("freelance_services")
      .select("id, service_title")
      .ilike("service_title", `%${titlePattern}%`)

    if (fetchError) {
      console.error("Error finding services:", fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!services || services.length === 0) {
      return { success: false, error: "No matching services found" }
    }

    // Delete all matching services
    const { error: deleteError } = await supabase
      .from("freelance_services")
      .delete()
      .ilike("service_title", `%${titlePattern}%`)

    if (deleteError) {
      console.error("Error deleting services:", deleteError)
      return { success: false, error: deleteError.message }
    }

    return { success: true, deletedCount: services.length }
  } catch (error) {
    console.error("Error in deleteFreelanceServiceByTitle:", error)
    return { success: false, error: "Failed to delete services" }
  }
}

// ========== FREELANCER DASHBOARD FUNCTIONS ==========

// Types for freelance requests
export type FreelanceRequestStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected"

export interface FreelanceRequest {
  id: string
  service_id: string
  freelancer_id: string
  customer_id: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  message: string
  budget?: number
  deadline?: string
  status: FreelanceRequestStatus
  freelancer_response?: string
  created_at: string
  updated_at: string
  // Joined data
  service?: {
    id: string
    service_title: string
    category: ServiceCategory
  }
  customer?: {
    id: string
    full_name: string
    provider_avatar?: string
  }
}

// Input type for creating a new service
export interface NewFreelanceServiceInput {
  service_title: string
  category: ServiceCategory
  experience_level: ExperienceLevel
  price: number
  price_type: PriceType
  description: string
  short_description: string
  skills: string[]
  delivery_time: string
  revisions: string
  languages: string[]
  response_time: string
  availability?: AvailabilityStatus
  video_url?: string
}

// Fetch freelancer's own services
export const fetchFreelancerServices = async (
  freelancerId: string
): Promise<FreelanceService[]> => {
  try {
    const { data: services, error } = await supabase
      .from("freelance_services")
      .select(
        `
        *,
        provider:user_profiles!freelance_services_provider_id_fkey(id, full_name, provider_avatar)
      `
      )
      .eq("provider_id", freelancerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching freelancer services:", error)
      throw error
    }

    return services || []
  } catch (error) {
    console.error("Error in fetchFreelancerServices:", error)
    return []
  }
}

// Create a new freelance service
export const createFreelanceService = async (
  freelancerId: string,
  serviceData: NewFreelanceServiceInput
): Promise<{ success: boolean; service?: FreelanceService; error?: string }> => {
  try {
    // Generate slug from title
    const slug = serviceData.service_title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now()

    const { data: service, error } = await supabase
      .from("freelance_services")
      .insert({
        provider_id: freelancerId,
        slug,
        service_title: serviceData.service_title,
        category: serviceData.category,
        experience_level: serviceData.experience_level,
        price: serviceData.price,
        price_type: serviceData.price_type,
        description: serviceData.description,
        short_description: serviceData.short_description,
        skills: serviceData.skills,
        delivery_time: serviceData.delivery_time,
        revisions: serviceData.revisions,
        languages: serviceData.languages,
        response_time: serviceData.response_time,
        availability: serviceData.availability || "available",
        video_url: serviceData.video_url,
        rating: 0,
        reviews_count: 0,
        completed_projects: 0,
        featured: false,
        verified: false,
        top_rated: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating freelance service:", error)
      return { success: false, error: error.message }
    }

    return { success: true, service }
  } catch (error) {
    console.error("Error in createFreelanceService:", error)
    return { success: false, error: "Failed to create service" }
  }
}

// Update a freelance service
export const updateFreelanceService = async (
  serviceId: string,
  freelancerId: string,
  updates: Partial<NewFreelanceServiceInput>
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("freelance_services")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", serviceId)
      .eq("provider_id", freelancerId)

    if (error) {
      console.error("Error updating freelance service:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateFreelanceService:", error)
    return { success: false, error: "Failed to update service" }
  }
}

// Update service availability
export const updateServiceAvailability = async (
  serviceId: string,
  freelancerId: string,
  availability: AvailabilityStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from("freelance_services")
      .update({ availability, updated_at: new Date().toISOString() })
      .eq("id", serviceId)
      .eq("provider_id", freelancerId)

    if (error) {
      console.error("Error updating availability:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateServiceAvailability:", error)
    return { success: false, error: "Failed to update availability" }
  }
}

// Fetch freelancer's requests
export const fetchFreelancerRequests = async (
  freelancerId: string
): Promise<FreelanceRequest[]> => {
  try {
    const { data: requests, error } = await supabase
      .from("freelance_requests")
      .select(
        `
        *,
        service:freelance_services(id, service_title, category),
        customer:user_profiles!freelance_requests_customer_id_fkey(id, full_name, provider_avatar)
      `
      )
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching freelancer requests:", error)
      throw error
    }

    return requests || []
  } catch (error) {
    console.error("Error in fetchFreelancerRequests:", error)
    return []
  }
}

// Update request status (for freelancers)
export const updateRequestStatus = async (
  requestId: string,
  freelancerId: string,
  status: FreelanceRequestStatus,
  response?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const updateData: { status: FreelanceRequestStatus; freelancer_response?: string } = { status }
    if (response) {
      updateData.freelancer_response = response
    }

    const { error } = await supabase
      .from("freelance_requests")
      .update(updateData)
      .eq("id", requestId)
      .eq("freelancer_id", freelancerId)

    if (error) {
      console.error("Error updating request status:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateRequestStatus:", error)
    return { success: false, error: "Failed to update request" }
  }
}

// Create a service request (for customers)
export const createServiceRequest = async (
  serviceId: string,
  freelancerId: string,
  customerId: string,
  data: {
    customer_name: string
    customer_phone: string
    customer_email?: string
    message: string
    budget?: number
    deadline?: string
  }
): Promise<{ success: boolean; request?: FreelanceRequest; error?: string }> => {
  try {
    const { data: request, error } = await supabase
      .from("freelance_requests")
      .insert({
        service_id: serviceId,
        freelancer_id: freelancerId,
        customer_id: customerId,
        ...data,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating service request:", error)
      return { success: false, error: error.message }
    }

    return { success: true, request }
  } catch (error) {
    console.error("Error in createServiceRequest:", error)
    return { success: false, error: "Failed to create request" }
  }
}

// Get freelancer stats
export interface FreelancerStats {
  totalServices: number
  totalRequests: number
  pendingRequests: number
  completedProjects: number
  totalEarnings: number
}

export const fetchFreelancerStats = async (
  freelancerId: string
): Promise<FreelancerStats> => {
  try {
    // Fetch services count
    const { count: servicesCount } = await supabase
      .from("freelance_services")
      .select("*", { count: "exact", head: true })
      .eq("provider_id", freelancerId)

    // Fetch requests
    const { data: requests } = await supabase
      .from("freelance_requests")
      .select("status, budget")
      .eq("freelancer_id", freelancerId)

    const totalRequests = requests?.length || 0
    const pendingRequests = requests?.filter(r => r.status === "pending").length || 0
    const completedRequests = requests?.filter(r => r.status === "completed") || []
    const totalEarnings = completedRequests.reduce((sum, r) => sum + (r.budget || 0), 0)

    // Get completed projects from services
    const { data: services } = await supabase
      .from("freelance_services")
      .select("completed_projects")
      .eq("provider_id", freelancerId)

    const completedProjects = services?.reduce((sum, s) => sum + (s.completed_projects || 0), 0) || 0

    return {
      totalServices: servicesCount || 0,
      totalRequests,
      pendingRequests,
      completedProjects,
      totalEarnings,
    }
  } catch (error) {
    console.error("Error fetching freelancer stats:", error)
    return {
      totalServices: 0,
      totalRequests: 0,
      pendingRequests: 0,
      completedProjects: 0,
      totalEarnings: 0,
    }
  }
}

// Subscribe to freelancer's requests updates
export const subscribeToFreelancerRequests = (
  freelancerId: string,
  onUpdate: (payload: unknown) => void
) => {
  const subscription = supabase
    .channel(`freelancer-requests-${freelancerId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "freelance_requests",
        filter: `freelancer_id=eq.${freelancerId}`,
      },
      onUpdate
    )
    .subscribe()

  return subscription
}
