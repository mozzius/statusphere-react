import { AuthRequiredError } from '@atproto/xrpc-server'
import { AppBskyActorProfile } from '@statusphere/lexicon'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { bskyProfileToProfileView, statusToStatusView } from '#/lib/hydrate'
import { getSessionAgent } from '#/session'

export default function (server: Server, ctx: AppContext) {
  server.xyz.statusphere.getUser({
    handler: async ({ req, res }) => {
      const agent = await getSessionAgent(req, res, ctx)
      if (!agent) {
        throw new AuthRequiredError('Authentication required')
      }

      const did = agent.assertDid

      const profileResponse = await agent.com.atproto.repo
        .getRecord({
          repo: did,
          collection: 'app.bsky.actor.profile',
          rkey: 'self',
        })
        .catch(() => undefined)

      const profileRecord = profileResponse?.data
      let profile: AppBskyActorProfile.Record = {} as AppBskyActorProfile.Record

      if (profileRecord && AppBskyActorProfile.isRecord(profileRecord.value)) {
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

      // Fetch user status
      const status = await ctx.db
        .selectFrom('status')
        .selectAll()
        .where('authorDid', '=', did)
        .orderBy('indexedAt', 'desc')
        .executeTakeFirst()

      return {
        encoding: 'application/json',
        body: {
          profile: await bskyProfileToProfileView(did, profile, ctx),
          status: status ? await statusToStatusView(status, ctx) : undefined,
        },
      }
    },
  })
}
