import { AppContext } from '#/context'
import { Server } from '#/lexicons'
import getStatuses from './lexicons/getStatuses'
import getUser from './lexicons/getUser'
import sendStatus from './lexicons/sendStatus'

export * as health from './health'
export * as oauth from './oauth'

export default function (server: Server, ctx: AppContext) {
  getStatuses(server, ctx)
  sendStatus(server, ctx)
  getUser(server, ctx)
  return server
}
