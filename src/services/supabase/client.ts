import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://enbrhhuubjvapadqyvds.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuYnJoaHV1Ymp2YXBhZHF5dmRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MDc2NjEsImV4cCI6MjA3ODQ4MzY2MX0.fAfcPDZjuODgcUKDChzx5DVqVmHCmN6ypf0kETwk5qI'

// Create Supabase client without strict typing for flexibility with database schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

// Get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}
