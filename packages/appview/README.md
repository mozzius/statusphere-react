# Statusphere AppView

This is the backend API for the Statusphere application. It provides REST endpoints for the React frontend to consume.

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create a `.env` file in the root of this package with the following variables:

```
NODE_ENV=development
HOST=localhost
PORT=3001
DB_PATH=./data.sqlite
COOKIE_SECRET=your_secret_here_at_least_32_characters_long
ATPROTO_SERVER=https://bsky.social
PUBLIC_URL=http://localhost:3001
NGROK_URL=your_ngrok_url_here
```

## Using ngrok for OAuth Development

Due to OAuth requirements, we need to use HTTPS for development. The easiest way to do this is with ngrok:

1. Install ngrok: https://ngrok.com/download
2. Run ngrok to create a tunnel to your local server:
   ```bash
   ngrok http 3001
   ```
3. Copy the HTTPS URL provided by ngrok (e.g., `https://abcd-123-45-678-90.ngrok.io`)
4. Add it to your `.env` file:
   ```
   NGROK_URL=https://abcd-123-45-678-90.ngrok.io
   ```
5. Also update the API URL in the client package:
   ```
   # In packages/client/src/services/api.ts
   const API_URL = 'https://abcd-123-45-678-90.ngrok.io';
   ```

## API Endpoints

- `GET /oauth-client-metadata.json` - OAuth client metadata
- `GET /oauth/callback` - OAuth callback endpoint
- `POST /login` - Login with handle
- `POST /logout` - Logout current user
- `GET /user` - Get current user info
- `GET /statuses` - Get recent statuses
- `POST /status` - Create a new status
