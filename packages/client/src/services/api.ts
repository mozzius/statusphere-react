import * as Lexicon from '@statusphere/lexicon'
import type {
  XyzStatusphereGetStatuses,
  XyzStatusphereGetUser,
  XyzStatusphereSendStatus,
} from '@statusphere/lexicon'

class StatusphereAgent extends Lexicon.AtpBaseClient {
  constructor() {
    super(StatusphereAgent.fetchHandler)
  }

  private static fetchHandler: Lexicon.AtpBaseClient['fetchHandler'] = (
    path,
    options,
  ) => {
    return fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
  }
}

const agent = new StatusphereAgent()

// API service
export const api = {
  // Login
  async login(handle: string) {
    const response = await fetch('/oauth/initiate', {
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
    const response = await fetch('/oauth/logout', {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    return response.json()
  },

  // Get current user
  getCurrentUser(params: XyzStatusphereGetUser.QueryParams) {
    return agent.xyz.statusphere.getUser(params)
  },

  // Get statuses
  getStatuses(params: XyzStatusphereGetStatuses.QueryParams) {
    return agent.xyz.statusphere.getStatuses(params)
  },

  // Create status
  createStatus(params: XyzStatusphereSendStatus.InputSchema) {
    return agent.xyz.statusphere.sendStatus(params)
  },
}

export default api
