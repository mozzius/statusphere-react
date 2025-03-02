# Statusphere React

A status sharing application built with React and the AT Protocol.

This is a React implementation of the [example application](https://atproto.com/guides/applications) covering:

- Signin via OAuth
- Fetch information about users (profiles)
- Listen to the network firehose for new data
- Publish data on the user's account using a custom schema

## Structure

- `packages/appview` - Express.js backend that serves API endpoints
- `packages/client` - React frontend using Vite

## Development

```bash
# Install dependencies
pnpm install

# Option 1: Local development (login won't work due to OAuth requirements)
pnpm dev

# Option 2: Development with OAuth login support (recommended)
pnpm dev:oauth
```

### OAuth Development

Due to OAuth requirements, HTTPS is needed for development. We've made this easy:

- `pnpm dev:oauth` - Sets up everything automatically:
  1. Starts ngrok to create an HTTPS tunnel
  2. Configures environment variables with the ngrok URL
  3. Starts both the API server and client app
  4. Handles proper shutdown of all processes

This all-in-one command makes OAuth development seamless.

### Additional Commands

```bash
# Build commands
pnpm build           # Build in correct order: lexicon → client → appview
pnpm build:lexicon   # Build only the lexicon package (type definitions)
pnpm build:client    # Build only the frontend
pnpm build:appview   # Build only the backend

# Start commands
pnpm start           # Start the server (serves API and frontend)
pnpm start:client    # Start frontend development server only
pnpm start:dev       # Start both backend and frontend separately (development only)

# Other utilities
pnpm typecheck       # Run type checking
pnpm format          # Format all code
```

## Deployment

For production deployment:

1. Build all packages in the correct order:
   ```bash
   pnpm build
   ```
   
   This will:
   - Build the lexicon package first (shared type definitions)
   - Build the frontend (`packages/client`) next
   - Finally build the backend (`packages/appview`)

2. Start the server:
   ```bash
   pnpm start
   ```

The backend server will:
- Serve the API at `/api/*` endpoints
- Serve the frontend static files from the client's build directory
- Handle client-side routing by serving index.html for all non-API routes

This simplifies deployment to a single process that handles both the API and serves the frontend assets.

## Environment Variables

Create a `.env` file in the root directory with:

```
# Required for AT Protocol authentication
ATP_SERVICE_DID=did:plc:your-service-did
ATP_CLIENT_ID=your-client-id
ATP_CLIENT_SECRET=your-client-secret
ATP_REDIRECT_URI=https://your-domain.com/oauth-callback

# Optional
PORT=3001
SESSION_SECRET=your-session-secret
```

## Requirements

- Node.js 18+
- pnpm 9+
- ngrok (for OAuth development)

## License

MIT
