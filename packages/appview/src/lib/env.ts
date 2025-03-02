import dotenv from 'dotenv'
import { cleanEnv, host, port, str, testOnly, url } from 'envalid'

dotenv.config()

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    devDefault: testOnly('test'),
    choices: ['development', 'production', 'test'],
  }),
  HOST: host({ devDefault: testOnly('localhost') }),
  PORT: port({ devDefault: testOnly(3001) }),
  DB_PATH: str({ devDefault: ':memory:' }),
  COOKIE_SECRET: str({ devDefault: '00000000000000000000000000000000' }),
  ATPROTO_SERVER: str({ default: 'https://bsky.social' }),
  SERVICE_DID: str({ default: undefined }),
  PUBLIC_URL: str({ default: 'http://localhost:3001' }),
  NGROK_URL: str({ default: '' }),
})
