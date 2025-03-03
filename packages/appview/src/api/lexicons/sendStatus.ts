import { TID } from '@atproto/common'
import {
  AuthRequiredError,
  InvalidRequestError,
  UpstreamFailureError,
} from '@atproto/xrpc-server'
import { XyzStatusphereStatus } from '@statusphere/lexicon'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { statusToStatusView } from '#/lib/hydrate'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  server.xyz.statusphere.sendStatus({
    handler: async ({ input, req, res }) => {
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        throw new AuthRequiredError('Authentication required')
      }

      // Construct & validate their status record
      const rkey = TID.nextStr()
      const record = {
        $type: 'xyz.statusphere.status',
        status: input.body.status,
        createdAt: new Date().toISOString(),
      }

      const validation = XyzStatusphereStatus.validateRecord(record)
      if (!validation.success) {
        throw new InvalidRequestError('Invalid status')
      }

      let uri
      try {
        // Write the status record to the user's repository
        const response = await agent.com.atproto.repo.putRecord({
          repo: agent.assertDid,
          collection: 'xyz.statusphere.status',
          rkey,
          record: validation.value,
          validate: false,
        })
        uri = response.data.uri
      } catch (err) {
        throw new UpstreamFailureError('Failed to write record')
      }

      const optimisticStatus = {
        uri,
        authorDid: agent.assertDid,
        status: record.status,
        createdAt: record.createdAt,
        indexedAt: new Date().toISOString(),
      }

      try {
        // Optimistically update our SQLite
        // This isn't strictly necessary because the write event will be
        // handled in #/firehose/ingestor.ts, but it ensures that future reads
        // will be up-to-date after this method finishes.
        await ctx.db.insertInto('status').values(optimisticStatus).execute()
      } catch (err) {
        ctx.logger.warn(
          { err },
          'failed to update computed view; ignoring as it should be caught by the firehose',
        )
      }

      return {
        encoding: 'application/json',
        body: {
          status: await statusToStatusView(optimisticStatus, ctx),
        },
      }
    },
  })
}
