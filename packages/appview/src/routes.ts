import type { IncomingMessage, ServerResponse } from 'node:http'
import { Agent } from '@atproto/api'
import { TID } from '@atproto/common'
import { OAuthResolverError } from '@atproto/oauth-client-node'
import { isValidHandle } from '@atproto/syntax'
import {
  AppBskyActorDefs,
  AppBskyActorProfile,
  XyzStatusphereStatus,
} from '@statusphere/lexicon'
import express from 'express'
import { getIronSession, SessionOptions } from 'iron-session'

import type { AppContext } from '#/index'
import { env } from '#/lib/env'
import { statusToStatusView } from '#/lib/hydrate'

type Session = { did: string }

// Common session options
const sessionOptions: SessionOptions = {
  cookieName: 'sid',
  password: env.COOKIE_SECRET,
  cookieOptions: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: true,
    path: '/',
    // Don't set domain explicitly - let browser determine it
    domain: undefined,
  },
}

// Helper function for defining routes
const handler =
  (
    fn: (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => Promise<void> | void,
  ) =>
  async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    try {
      await fn(req, res, next)
    } catch (err) {
      next(err)
    }
  }

// Helper function to get the Atproto Agent for the active session
async function getSessionAgent(
  req: IncomingMessage | express.Request,
  res: ServerResponse<IncomingMessage> | express.Response,
  ctx: AppContext,
) {
  const session = await getIronSession<Session>(req, res, sessionOptions)

  if (!session.did) {
    return null
  }

  try {
    const oauthSession = await ctx.oauthClient.restore(session.did)
    return oauthSession ? new Agent(oauthSession) : null
  } catch (err) {
    ctx.logger.warn({ err }, 'oauth restore failed')
    session.destroy()
    return null
  }
}

export const createRouter = (ctx: AppContext) => {
  const router = express.Router()

  // Simple CORS configuration for all routes
  router.use((req, res, next) => {
    // Allow requests from either the specific origin or any origin during development
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
      res.status(200).end()
      return
    }
    next()
  })

  // OAuth metadata
  router.get(
    '/client-metadata.json',
    handler((_req, res) => {
      res.json(ctx.oauthClient.clientMetadata)
    }),
  )

  // OAuth callback to complete session creation
  router.get(
    '/oauth/callback',
    handler(async (req, res) => {
      // Get the query parameters from the URL
      const params = new URLSearchParams(req.originalUrl.split('?')[1])

      try {
        const { session } = await ctx.oauthClient.callback(params)

        // Use the common session options
        const clientSession = await getIronSession<Session>(
          req,
          res,
          sessionOptions,
        )

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
    }),
  )

  // Login handler
  router.post(
    '/login',
    handler(async (req, res) => {
      // Validate
      const handle = req.body?.handle
      if (typeof handle !== 'string' || !isValidHandle(handle)) {
        res.status(400).json({ error: 'invalid handle' })
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
            : "couldn't initiate login"
        res.status(500).json({ error: errorMsg })
      }
    }),
  )

  // Logout handler
  router.post(
    '/logout',
    handler(async (req, res) => {
      const session = await getIronSession<Session>(req, res, sessionOptions)
      session.destroy()
      res.json({ success: true })
    }),
  )

  // Get current user info
  router.get(
    '/user',
    handler(async (req, res) => {
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        res.status(401).json({ error: 'Not logged in' })
        return
      }

      const did = agent.assertDid

      // Fetch user profile
      try {
        const profileResponse = await agent.com.atproto.repo
          .getRecord({
            repo: did,
            collection: 'app.bsky.actor.profile',
            rkey: 'self',
          })
          .catch(() => undefined)

        const profileRecord = profileResponse?.data
        let profile: AppBskyActorProfile.Record =
          {} as AppBskyActorProfile.Record

        if (
          profileRecord &&
          AppBskyActorProfile.isRecord(profileRecord.value)
        ) {
          const validated = AppBskyActorProfile.validateRecord(
            profileRecord.value,
          )
          if (validated.success) {
            profile = profileRecord.value
          } else {
            ctx.logger.error(
              { err: validated.error },
              'Failed to validate user profile',
            )
          }
        }

        const profileView: AppBskyActorDefs.ProfileView = {
          $type: 'app.bsky.actor.defs#profileView',
          did: did,
          handle: await ctx.resolver.resolveDidToHandle(did),
          avatar: profile.avatar
            ? `https://atproto.pictures/img/${did}/${profile.avatar.ref}`
            : undefined,
          displayName: profile.displayName,
          createdAt: profile.createdAt,
        }

        // Fetch user status
        const status = await ctx.db
          .selectFrom('status')
          .selectAll()
          .where('authorDid', '=', did)
          .orderBy('indexedAt', 'desc')
          .executeTakeFirst()

        res.json({
          did: agent.assertDid,
          profile: profileView,
          status: status ? await statusToStatusView(status, ctx) : undefined,
        })
      } catch (err) {
        ctx.logger.error({ err }, 'Failed to get user info')
        res.status(500).json({ error: 'Failed to get user info' })
      }
    }),
  )

  // Get statuses
  router.get(
    '/statuses',
    handler(async (req, res) => {
      try {
        // Fetch data stored in our SQLite
        const statuses = await ctx.db
          .selectFrom('status')
          .selectAll()
          .orderBy('indexedAt', 'desc')
          .limit(30)
          .execute()

        res.json({
          statuses: await Promise.all(
            statuses.map((status) => statusToStatusView(status, ctx)),
          ),
        })
      } catch (err) {
        ctx.logger.error({ err }, 'Failed to get statuses')
        res.status(500).json({ error: 'Failed to get statuses' })
      }
    }),
  )

  // Create status
  router.post(
    '/status',
    handler(async (req, res) => {
      // If the user is signed in, get an agent which communicates with their server
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        res.status(401).json({ error: 'Session required' })
        return
      }

      // Construct & validate their status record
      const rkey = TID.nextStr()
      const record = {
        $type: 'xyz.statusphere.status',
        status: req.body?.status,
        createdAt: new Date().toISOString(),
      }
      if (!XyzStatusphereStatus.validateRecord(record).success) {
        res.status(400).json({ error: 'Invalid status' })
        return
      }

      let uri
      try {
        // Write the status record to the user's repository
        const response = await agent.com.atproto.repo.putRecord({
          repo: agent.assertDid,
          collection: 'xyz.statusphere.status',
          rkey,
          record,
          validate: false,
        })
        uri = response.data.uri
      } catch (err) {
        ctx.logger.warn({ err }, 'failed to write record')
        res.status(500).json({ error: 'Failed to write record' })
        return
      }

      try {
        // Optimistically update our SQLite
        // This isn't strictly necessary because the write event will be
        // handled in #/firehose/ingestor.ts, but it ensures that future reads
        // will be up-to-date after this method finishes.
        await ctx.db
          .insertInto('status')
          .values({
            uri,
            authorDid: agent.assertDid,
            status: record.status,
            createdAt: record.createdAt,
            indexedAt: new Date().toISOString(),
          })
          .execute()

        res.json({
          success: true,
          uri,
          status: await statusToStatusView(record.status, ctx),
        })
      } catch (err) {
        ctx.logger.warn(
          { err },
          'failed to update computed view; ignoring as it should be caught by the firehose',
        )
        res.json({
          success: true,
          uri,
          status: await statusToStatusView(record.status, ctx),
          warning: 'Database not updated',
        })
      }
    }),
  )

  return router
}
