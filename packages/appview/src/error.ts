import { XRPCError } from '@atproto/xrpc-server'
import { ErrorRequestHandler } from 'express'

import { AppContext } from '#/context'

export const createHandler: (ctx: AppContext) => ErrorRequestHandler =
  (ctx) => (err, _req, res, next) => {
    ctx.logger.error('unexpected internal server error', err)
    if (res.headersSent) {
      return next(err)
    }
    const serverError = XRPCError.fromError(err)
    res.status(serverError.type).json(serverError.payload)
  }
