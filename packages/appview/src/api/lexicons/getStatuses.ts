import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { statusToStatusView } from '#/lib/hydrate'

export default function (server: Server, ctx: AppContext) {
  server.xyz.statusphere.getStatuses({
    handler: async ({ params }) => {
      // Fetch data stored in our SQLite
      const statuses = await ctx.db
        .selectFrom('status')
        .selectAll()
        .orderBy('indexedAt', 'desc')
        .limit(params.limit)
        .execute()

      return {
        encoding: 'application/json',
        body: {
          statuses: await Promise.all(
            statuses.map((status) => statusToStatusView(status, ctx)),
          ),
        },
      }
    },
  })
}
