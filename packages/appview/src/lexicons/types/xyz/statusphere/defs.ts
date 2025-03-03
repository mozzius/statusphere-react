/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, ValidationResult } from '@atproto/lexicon'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, $Typed, OmitKey } from '../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'xyz.statusphere.defs'

export interface StatusView {
  $type?: 'xyz.statusphere.defs#statusView'
  uri: string
  status: string
  createdAt: string
  profile: ProfileView
}

const hashStatusView = 'statusView'

export function isStatusView<V>(v: V) {
  return is$typed(v, id, hashStatusView)
}

export function validateStatusView<V>(v: V) {
  return validate<StatusView & V>(v, id, hashStatusView)
}

export interface ProfileView {
  $type?: 'xyz.statusphere.defs#profileView'
  did: string
  handle: string
}

const hashProfileView = 'profileView'

export function isProfileView<V>(v: V) {
  return is$typed(v, id, hashProfileView)
}

export function validateProfileView<V>(v: V) {
  return validate<ProfileView & V>(v, id, hashProfileView)
}
