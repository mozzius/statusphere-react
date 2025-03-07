import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    host: '127.0.0.1',
    port: 3000,
    proxy: {
      '^/(xrpc|oauth|client-metadata\.json)/.*': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
