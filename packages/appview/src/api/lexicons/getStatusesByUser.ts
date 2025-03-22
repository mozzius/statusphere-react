import { AtpBaseClient } from '@atproto/api'
import { TID } from '@atproto/common'

import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import { statusToStatusView } from '#/lib/hydrate'

export default function (server: Server, ctx: AppContext) {
  server.xyz.statusphere.getStatusesByUser({
    handler: async ({ req, res }) => {
      if (!req.query.handle) {
        return {
          status: 400,
          message: 'User handle must be included',
        }
      }
      const handle = req.query.handle as string

      const did = await ctx.resolver.resolveHandleToDid(handle)
      if (!did) {
        return {
          status: 400,
          message: 'Handle is wrong',
        }
      }

      const didDoc = await ctx.resolver.resolveDidDocFromDid(did)
      const client = new AtpBaseClient(didDoc.pds)
      const userRecords = await client.com.atproto.repo.listRecords({
        limit: 10,
        repo: did,
        collection: 'xyz.statusphere.status',
      })

      if (!userRecords.success) {
        return {
          status: 500,
          message: 'Failed to list records xyz.statusphere.status',
        }
      }

      if (userRecords?.data.records.length === 0) {
        return {
          status: 400,
          message: `${handle} does not have collection xyz.statusphere.status`,
        }
      }

      // console.log(userRecords.success)
      // console.log(userRecords.data.records)

      if (userRecords.success && userRecords.data.records.length > 0) {
        try {
          for (const record of userRecords.data.records) {
            await ctx.db
              .insertInto('status')
              .values({
                uri: record.uri,
                status: record.value?.status as string,
                authorDid: did,
                createdAt: record.value?.createdAt as string,
                indexedAt: new Date().toISOString(),
              })
              .onConflict((oc) =>
                oc.column('uri').doUpdateSet({
                  status: record.value?.status as string,
                  indexedAt: new Date().toISOString(),
                }),
              )
              .execute()
          }
        } catch (e) {
          console.log('error from pushing records into db', e)
        }
      }

      const preExistingData = await ctx.db
        .selectFrom('status')
        .selectAll()
        .where('authorDid', '=', did)
        .execute()

      return {
        encoding: 'application/json',
        body: {
          statuses: await Promise.all(
            preExistingData.map((data) => statusToStatusView(data, ctx)),
          ),
        },
      }
    },
  })
}
