import { NodeOAuthClient } from '@atproto/oauth-client-node'

import type { Database } from '#/db'
import { env } from '#/lib/env'
import { SessionStore, StateStore } from './storage'

export const createClient = async (db: Database) => {
  // Get the ngrok URL from environment variables
  const ngrokUrl = env.NGROK_URL

  if (!ngrokUrl && env.NODE_ENV === 'development') {
    console.warn(
      'WARNING: NGROK_URL is not set. OAuth login might not work properly.',
    )
    console.warn(
      'You should run ngrok and set the NGROK_URL environment variable.',
    )
    console.warn('Example: NGROK_URL=https://abcd-123-45-678-90.ngrok.io')
  } else if (env.NODE_ENV === 'production' && !env.PUBLIC_URL) {
    throw new Error('PUBLIC_URL is not set')
  }

  const baseUrl = ngrokUrl || env.PUBLIC_URL || `http://127.0.0.1:${env.PORT}`

  return new NodeOAuthClient({
    clientMetadata: {
      client_name: 'Statusphere React App',
      client_id: `${baseUrl}/api/client-metadata.json`,
      client_uri: baseUrl,
      redirect_uris: [`${baseUrl}/api/oauth/callback`],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  })
}
