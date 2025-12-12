import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { UserProfile } from '@/services/supabase/types'
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithGoogle as authSignInWithGoogle,
  getCurrentProfile,
  updateProfile as authUpdateProfile,
  onAuthStateChange,
  SignInData,
  SignUpData,
  AuthResponse,
} from '@/services/supabase/authService'
import {
  registerPushToken,
  clearPushToken,
  setupNotificationListeners,
} from '@/services/notificationService'

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (data: SignInData) => Promise<AuthResponse>
  signUp: (data: SignUpData) => Promise<AuthResponse>
  signInWithGoogle: () => Promise<AuthResponse>
  signOut: () => Promise<AuthResponse>
  updateProfile: (updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>) => Promise<AuthResponse>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const initAuth = async () => {
      try {
        const profile = await getCurrentProfile()
        setUser(profile)
        // Register push token for existing seller sessions
        if (profile && (profile.role === 'seller' || profile.role === 'admin')) {
          registerPushToken(profile.id)
        }
      } catch (error) {
        console.error('Auth init error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((profile) => {
      setUser(profile)
      setIsLoading(false)
    })

    // Set up notification listeners
    const cleanupNotifications = setupNotificationListeners(
      (notification) => {
        console.log('Notification received in foreground:', notification)
      },
      (response) => {
        console.log('User tapped notification:', response)
        // Navigate to orders/dashboard when notification is tapped
      }
    )

    return () => {
      subscription.unsubscribe()
      cleanupNotifications()
    }
  }, [])

  const signIn = async (data: SignInData): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const response = await authSignIn(data)
      if (response.success && response.user) {
        setUser(response.user)
        // Register push token for sellers
        if (response.user.role === 'seller' || response.user.role === 'admin') {
          registerPushToken(response.user.id)
        }
      }
      return response
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const response = await authSignUp(data)
      if (response.success && response.user) {
        setUser(response.user)
        // Register push token for sellers
        if (response.user.role === 'seller' || response.user.role === 'admin') {
          registerPushToken(response.user.id)
        }
      }
      return response
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async (): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      const response = await authSignInWithGoogle()
      if (response.success && response.user) {
        setUser(response.user)
        // Register push token for sellers
        if (response.user.role === 'seller' || response.user.role === 'admin') {
          registerPushToken(response.user.id)
        }
      }
      return response
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async (): Promise<AuthResponse> => {
    setIsLoading(true)
    try {
      // Clear push token before signing out
      if (user?.id) {
        await clearPushToken(user.id)
      }
      const response = await authSignOut()
      if (response.success) {
        setUser(null)
      }
      return response
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (
    updates: Partial<Pick<UserProfile, 'full_name' | 'phone' | 'avatar_url'>>
  ): Promise<AuthResponse> => {
    if (!user) {
      return { success: false, error: 'No user logged in' }
    }

    setIsLoading(true)
    try {
      const response = await authUpdateProfile(user.id, updates)
      if (response.success && response.user) {
        setUser(response.user)
      }
      return response
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async (): Promise<void> => {
    const profile = await getCurrentProfile()
    setUser(profile)
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
