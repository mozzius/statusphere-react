import {
  AppBskyActorDefs,
  AppBskyActorProfile,
  XyzStatusphereDefs,
} from '@statusphere/lexicon'

import { AppContext } from '#/context'
import { Status } from '#/db'

const INVALID_HANDLE = 'handle.invalid'

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
        .then((handle) => (handle.startsWith('did:') ? INVALID_HANDLE : handle))
        .catch(() => INVALID_HANDLE),
    },
  }
}

export async function bskyProfileToProfileView(
  did: string,
  profile: AppBskyActorProfile.Record,
  ctx: AppContext,
): Promise<AppBskyActorDefs.ProfileView> {
  return {
    $type: 'app.bsky.actor.defs#profileView',
    did: did,
    handle: await ctx.resolver.resolveDidToHandle(did),
    avatar: profile.avatar
      ? `https://atproto.pictures/img/${did}/${profile.avatar.ref}`
      : undefined,
    displayName: profile.displayName,
    createdAt: profile.createdAt,
  }
}
