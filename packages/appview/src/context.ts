import { OAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import pino from 'pino'

import { Database } from '#/db'
import { BidirectionalResolver } from '#/id-resolver'
import { Jetstream } from '#/ingestors'

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database
  ingester: Firehose | Jetstream<any>
  logger: pino.Logger
  oauthClient: OAuthClient
  resolver: BidirectionalResolver
}
