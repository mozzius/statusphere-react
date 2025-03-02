import { XyzStatusphereDefs } from '@statusphere/lexicon'

import { Status } from '#/db'
import { AppContext } from '#/index'

export async function statusToStatusView(
  status: Status,
  ctx: AppContext,
): Promise<XyzStatusphereDefs.StatusView> {
  return {
    uri: status.uri,
    status: status.status,
    createdAt: status.createdAt,
    profile: {
      did: status.authorDid,
      handle: await ctx.resolver
        .resolveDidToHandle(status.authorDid)
        .catch(() => 'invalid.handle'),
    },
  }
}
