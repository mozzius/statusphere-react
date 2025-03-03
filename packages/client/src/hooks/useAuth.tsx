import { createContext, ReactNode, useContext, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { XRPCError } from '@atproto/xrpc'
import { XyzStatusphereGetUser } from '@statusphere/lexicon'

import api from '#/services/api'

interface AuthContextType {
  user: XyzStatusphereGetUser.OutputSchema | null
  loading: boolean
  error: string | null
  login: (handle: string) => Promise<{ redirectUrl: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Use React Query to fetch and manage user data
  const {
    data: user,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // Check for error parameter in URL (from OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get('error')

      if (errorParam) {
        setError('Authentication failed. Please try again.')

        // Remove the error parameter from the URL
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
        return null
      }

      try {
        const { data: userData } = await api.getCurrentUser({})

        // Clean up URL if needed
        if (window.location.search && userData) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          )
        }

        return userData
      } catch (apiErr) {
        if (
          apiErr instanceof XRPCError &&
          apiErr.error === 'AuthenticationRequired'
        ) {
          return null
        }

        console.error('🚫 API error during auth check:', apiErr)

        // If it's a network error, provide a more helpful message
        if (
          apiErr instanceof TypeError &&
          apiErr.message.includes('Failed to fetch')
        ) {
          throw new Error(
            'Cannot connect to API server. Please check your network connection or server status.',
          )
        }

        throw apiErr
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const login = async (handle: string) => {
    setError(null)

    try {
      return await api.login(handle)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      // Reset the user data in React Query cache
      queryClient.setQueryData(['currentUser'], null)
      // Invalidate any user-dependent queries
      queryClient.invalidateQueries({ queryKey: ['statuses'] })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed'
      setError(message)
      throw err
    }
  }

  // Combine state error with query error
  const combinedError =
    error || (queryError instanceof Error ? queryError.message : null)

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        loading,
        error: combinedError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

export default useAuth
