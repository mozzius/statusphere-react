/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { BlobRef, ValidationResult } from '@atproto/lexicon'
import { HeadersMap, XRPCError } from '@atproto/xrpc'
import { CID } from 'multiformats/cid'

import { validate as _validate } from '../../../lexicons'
import { is$typed as _is$typed, $Typed, OmitKey } from '../../../util'
import type * as XyzStatusphereDefs from './defs.js'

const is$typed = _is$typed,
  validate = _validate
const id = 'xyz.statusphere.sendStatus'

export interface QueryParams {}

export interface InputSchema {
  status: string
}

export interface OutputSchema {
  status: XyzStatusphereDefs.StatusView
}

export interface CallOptions {
  signal?: AbortSignal
  headers?: HeadersMap
  qp?: QueryParams
  encoding?: 'application/json'
}

export interface Response {
  success: boolean
  headers: HeadersMap
  data: OutputSchema
}

export function toKnownErr(e: any) {
  return e
}
