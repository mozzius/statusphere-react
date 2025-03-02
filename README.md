# Statusphere React

A monorepo for the Statusphere application, which includes a React client and a Node.js backend.

This is a React refactoring of the [example application](https://atproto.com/guides/applications) covering:

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
# Build both packages
pnpm build

# Run typecheck on both packages
pnpm typecheck

# Format all code
pnpm format
```

## Requirements

- Node.js 18+
- pnpm 9+
- ngrok (for OAuth development)

## License

MIT
