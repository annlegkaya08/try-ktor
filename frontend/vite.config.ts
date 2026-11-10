import { defineConfig } from 'vite'

// В dev-режиме запросы к /calculate уходят на Ktor-сервер, поэтому CORS не нужен.
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/calculate': 'http://localhost:8081',
    },
  },
})
