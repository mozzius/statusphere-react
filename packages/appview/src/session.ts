import { IncomingMessage, ServerResponse } from 'node:http'
import { Agent } from '@atproto/api'
import { Request, Response } from 'express'
import { getIronSession, SessionOptions } from 'iron-session'

import { AppContext } from '#/context'
import { env } from '#/lib/env'

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

export async function getSessionAgent(
  req: IncomingMessage | Request,
  res: ServerResponse<IncomingMessage> | Response,
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

export async function getSession(req: Request, res: Response) {
  return getIronSession<Session>(req, res, sessionOptions)
}
