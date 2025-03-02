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
const id = 'com.atproto.repo.uploadBlob'

export interface QueryParams {}

export type InputSchema = string | Uint8Array | Blob

export interface OutputSchema {
  blob: BlobRef
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: string
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
