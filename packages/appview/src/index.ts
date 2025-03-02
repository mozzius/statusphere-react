import events from 'node:events'
import fs from 'node:fs'
import type http from 'node:http'
import path from 'node:path'
import type { OAuthClient } from '@atproto/oauth-client-node'
import { Firehose } from '@atproto/sync'
import cors from 'cors'
import express, { type Express } from 'express'
import { pino } from 'pino'

import { createClient } from '#/auth/client'
import { createDb, migrateToLatest } from '#/db'
import type { Database } from '#/db'
import {
  BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from '#/id-resolver'
import { createIngester } from '#/ingester'
import { env } from '#/lib/env'
import { createRouter } from '#/routes'

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database
  ingester: Firehose
  logger: pino.Logger
  oauthClient: OAuthClient
  resolver: BidirectionalResolver
}

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext,
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT, DB_PATH } = env
    const logger = pino({ name: 'server start' })

    // Set up the SQLite database
    const db = createDb(DB_PATH)
    await migrateToLatest(db)

    // Create the atproto utilities
    const oauthClient = await createClient(db)
    const baseIdResolver = createIdResolver()
    const ingester = createIngester(db, baseIdResolver)
    const resolver = createBidirectionalResolver(baseIdResolver)
    const ctx = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
    }

    // Subscribe to events on the firehose
    ingester.start()

    // Create our server
    const app: Express = express()
    app.set('trust proxy', true)

    // CORS configuration based on environment
    if (env.NODE_ENV === 'development') {
      // In development, allow multiple origins including ngrok
      app.use(
        cors({
          origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps, curl)
            if (!origin) return callback(null, true)

            // List of allowed origins
            const allowedOrigins = [
              'http://localhost:3000', // Standard React port
              'http://127.0.0.1:3000', // Alternative React address
            ]

            // If we have an ngrok URL defined, add it to allowed origins
            if (env.NGROK_URL) {
              try {
                const ngrokOrigin = new URL(env.NGROK_URL)
                const ngrokClientOrigin = `${ngrokOrigin.protocol}//${ngrokOrigin.hostname}:3000`
                allowedOrigins.push(ngrokClientOrigin)
              } catch (err) {
                console.error('Failed to parse NGROK_URL for CORS:', err)
              }
            }

            // Check if the request origin is in our allowed list or is an ngrok domain
            if (
              allowedOrigins.indexOf(origin) !== -1 ||
              origin.includes('ngrok-free.app')
            ) {
              callback(null, true)
            } else {
              console.warn(`⚠️ CORS blocked origin: ${origin}`)
              callback(null, false)
            }
          },
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        }),
      )
    } else {
      // In production, CORS is not needed if frontend and API are on same domain
      // But we'll still enable it for flexibility with minimal configuration
      app.use(
        cors({
          origin: true, // Use req.origin, which means same-origin requests will always be allowed
          credentials: true,
        }),
      )
    }

    // Routes & middlewares
    const router = createRouter(ctx)
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Two versions of the API routes:
    // 1. Mounted at /api for the client
    app.use('/api', router)

    // Serve static files from the frontend build
    const frontendPath = path.resolve(
      __dirname,
      '../../../packages/client/dist',
    )

    // Check if the frontend build exists
    if (fs.existsSync(frontendPath)) {
      logger.info(`Serving frontend static files from: ${frontendPath}`)

      // Serve static files
      app.use(express.static(frontendPath))

      // For any other requests, send the index.html file
      app.get('*', (req, res) => {
        // Only handle non-API paths
        if (!req.path.startsWith('/api/')) {
          res.sendFile(path.join(frontendPath, 'index.html'))
        } else {
          res.status(404).json({ error: 'API endpoint not found' })
        }
      })
    } else {
      logger.warn(`Frontend build not found at: ${frontendPath}`)
      app.use('*', (_req, res) => {
        res.sendStatus(404)
      })
    }

    // Use the port from env (should be 3001 for the API server)
    const server = app.listen(env.PORT)
    await events.once(server, 'listening')
    logger.info(
      `API Server (${NODE_ENV}) running on port http://${HOST}:${env.PORT}`,
    )

    return new Server(app, server, ctx)
  }

  async close() {
    this.ctx.logger.info('sigint received, shutting down')
    await this.ctx.ingester.destroy()
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info('server closed')
        resolve()
      })
    })
  }
}

const run = async () => {
  const server = await Server.create()

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref() // Force shutdown after 10s
    await server.close()
    process.exit()
  }

  process.on('SIGINT', onCloseSignal)
  process.on('SIGTERM', onCloseSignal)
}

run()
