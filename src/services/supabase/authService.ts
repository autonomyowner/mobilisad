import { supabase } from './client'
import { UserProfile, UserRole } from './types'

export interface SignUpData {
  email: string
  password: string
  fullName?: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: UserProfile
}

// Sign up a new user
export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
  try {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
      },
    })

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      return { success: false, error: signUpError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to create user' }
    }

    // Create profile in profiles table
    const profile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
      id: authData.user.id,
      email: data.email,
      full_name: data.fullName,
      phone: data.phone,
      role: 'customer' as UserRole,
    }

    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert(profile)

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // User was created but profile failed - still consider it a success
      // Profile can be created later on first sign in
    }

    return {
      success: true,
      user: {
        ...profile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Sign up exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Sign in an existing user
export const signIn = async (data: SignInData): Promise<AuthResponse> => {
  try {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return { success: false, error: signInError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'Failed to sign in' }
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Create profile if it doesn't exist
      const newProfile: Omit<UserProfile, 'created_at' | 'updated_at'> = {
        id: authData.user.id,
        email: authData.user.email || data.email,
        full_name: authData.user.user_metadata?.full_name,
        phone: authData.user.user_metadata?.phone,
        role: 'customer' as UserRole,
      }

      await supabase.from('user_profiles').insert(newProfile)

      return {
        success: true,
        user: {
          ...newProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    }

    return { success: true, user: profile }
  } catch (error) {
    console.error('Sign in exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Sign out the current user
export const signOut = async (): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Sign out error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Sign out exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Get current user profile
export const getCurrentProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Get profile error:', profileError)
      return null
    }

    return profile
  } catch (error) {
    console.error('Get profile exception:', error)
    return null
  }
}

// Update user profile
export const updateProfile = async (
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<AuthResponse> => {
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, user: profile }
  } catch (error) {
    console.error('Update profile exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Reset password
export const resetPassword = async (email: string): Promise<AuthResponse> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)

    if (error) {
      console.error('Reset password error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Reset password exception:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: UserProfile | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await getCurrentProfile()
      callback(profile)
    } else {
      callback(null)
    }
  })
}
