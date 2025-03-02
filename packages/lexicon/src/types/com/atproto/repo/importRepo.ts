/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, ValidationResult } from '@atproto/lexicon'
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../../lexicons'
import { is$typed as _is$typed, $Typed, OmitKey } from '../../../../util'

const is$typed = _is$typed,
  validate = _validate
const id = 'com.atproto.repo.importRepo'

export interface QueryParams {}

export type InputSchema = string | Uint8Array | Blob

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/vnd.ipld.car'
}

export interface Response {
  success: boolean
  headers: HeadersMap
}

export function toKnownErr(e: any) {
  return e
}
