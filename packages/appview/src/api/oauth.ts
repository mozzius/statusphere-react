import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isValidHandle } from '@atproto/syntax'
import express from 'express'

import { AppContext } from '#/context'
import { getSession } from '#/session'

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  // OAuth metadata
  router.get('/oauth-client-metadata.json', (_req, res) => {
    res.json(ctx.oauthClient.clientMetadata)
  })

  // OAuth callback to complete session creation
  router.get('/oauth/callback', async (req, res) => {
    // Get the query parameters from the URL
    const params = new URLSearchParams(req.originalUrl.split('?')[1])

    try {
      const { session } = await ctx.oauthClient.callback(params)

      // Use the common session options
      const clientSession = await getSession(req, res)

      // Set the DID on the session
      clientSession.did = session.did
      await clientSession.save()

      // Get the origin and determine appropriate redirect
      const host = req.get('host') || ''
      const protocol = req.protocol || 'http'
      const baseUrl = `${protocol}://${host}`

      ctx.logger.info(
        `OAuth callback successful, redirecting to ${baseUrl}/oauth-callback`,
      )

      // Redirect to the frontend oauth-callback page
      res.redirect('/oauth-callback')
    } catch (err) {
      ctx.logger.error({ err }, 'oauth callback failed')

      // Handle error redirect - stay on same domain
      res.redirect('/oauth-callback?error=auth')
    }
  })

  // Login handler
  router.post('/oauth/initiate', async (req, res) => {
    // Validate
    const handle = req.body?.handle
    if (
      typeof handle !== 'string' ||
      !(isValidHandle(handle) || isValidUrl(handle))
    ) {
      res.status(400).json({ error: 'Invalid handle' })
      return
    }

    // Initiate the OAuth flow
    try {
      const url = await ctx.oauthClient.authorize(handle, {
        scope: 'atproto transition:generic',
      })
      res.json({ redirectUrl: url.toString() })
    } catch (err) {
      ctx.logger.error({ err }, 'oauth authorize failed')
      const errorMsg =
        err instanceof OAuthResolverError
          ? err.message
          : "Couldn't initiate login"
      res.status(500).json({ error: errorMsg })
    }
  })

  // Logout handler
  router.post('/oauth/logout', async (req, res) => {
    const session = await getSession(req, res)
    session.destroy()
    res.json({ success: true })
  })

  return router
}

function isValidUrl(url: string): boolean {
  try {
    const urlp = new URL(url)
    // http or https
    return urlp.protocol === 'http:' || urlp.protocol === 'https:'
  } catch (error) {
    return false
  }
}
