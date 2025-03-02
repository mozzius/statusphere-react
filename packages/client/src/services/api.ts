import { AppBskyActorDefs, XyzStatusphereDefs } from '@statusphere/lexicon'

const API_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function for logging API actions
function logApiCall(
  method: string,
  endpoint: string,
  status?: number,
  error?: any,
) {
  const statusStr = status ? `[${status}]` : ''
  const errorStr = error
    ? ` - Error: ${error.message || JSON.stringify(error)}`
    : ''
  console.log(`🔄 API ${method} ${endpoint} ${statusStr}${errorStr}`)
}

export interface User {
  did: string
  profile: AppBskyActorDefs.ProfileView
  status?: XyzStatusphereDefs.StatusView
}

// API service
export const api = {
  // Get base URL
  getBaseUrl() {
    return API_URL || ''
  },
  // Login
  async login(handle: string) {
    const url = API_URL ? `${API_URL}/login` : '/login'
    logApiCall('POST', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ handle }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Login failed')
    }

    return response.json()
  },

  // Logout
  async logout() {
    const url = API_URL ? `${API_URL}/logout` : '/logout'
    logApiCall('POST', url)
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return response.json()
  },

  // Get current user
  async getCurrentUser() {
    const url = API_URL ? `${API_URL}/user` : '/user'
    logApiCall('GET', url)
    try {
      console.log('📞 Fetching user from:', url, 'with credentials included')
      // Debug output - what headers are we sending?
      const headers = {
        Accept: 'application/json',
      }
      console.log('📨 Request headers:', headers)

      const response = await fetch(url, {
        credentials: 'include', // This is crucial for sending cookies
        headers,
        cache: 'no-cache', // Don't cache this request
      })

      logApiCall('GET', '/user', response.status)

      if (!response.ok) {
        if (response.status === 401) {
          return null
        }

        // Try to get error details
        let errorText = ''
        try {
          const errorData = await response.text()
          errorText = errorData
        } catch (e) {
          // Ignore error reading error
        }

        throw new Error(
          `Failed to get user: ${response.status} ${response.statusText} ${errorText}`,
        )
      }

      return response.json()
    } catch (error) {
      logApiCall('GET', '/user', undefined, error)
      if (
        error instanceof TypeError &&
        error.message.includes('Failed to fetch')
      ) {
        console.error('Network error - Unable to connect to API server')
      }
      throw error
    }
  },

  // Get statuses
  async getStatuses() {
    const url = API_URL ? `${API_URL}/statuses` : '/statuses'
    logApiCall('GET', url)
    const response = await fetch(url, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Failed to get statuses')
    }

    return response.json() as Promise<{
      statuses: XyzStatusphereDefs.StatusView[]
    }>
  },

  // Create status
  async createStatus(status: string) {
    const url = API_URL ? `${API_URL}/status` : '/status'
    logApiCall('POST', url)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create status')
    }

    return response.json()
  },
}

export default api
