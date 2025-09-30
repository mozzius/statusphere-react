# Statusphere React

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/P-FGPW?referralCode=e99Eop&utm_medium=integration&utm_source=template&utm_campaign=generic)

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

# Run this once, to run codegen from the lexicons
pnpm build:lexicon

pnpm dev
```

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

- Serve the API at `/xrpc/*` and `/oauth/*` endpoints
- Serve the frontend static files from the client's build directory
- Handle client-side routing by serving index.html for all non-API routes

This simplifies deployment to a single process that handles both the API and serves the frontend assets.

## Environment Variables

Copy the `.env.template` file in the appview to `.env`:

```
cd packages/appview
cp .env.template .env
```

## Requirements

- Node.js 18+
- pnpm 9+

## License

MIT
