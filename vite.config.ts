import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  define: {
    // Vite doesn't provide process.env; define it so Next-style env vars don't crash the app
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_AUTH_API_URL: process.env.NEXT_PUBLIC_AUTH_API_URL || '',
      NEXT_PUBLIC_TRANSACTION_API_URL: process.env.NEXT_PUBLIC_TRANSACTION_API_URL || '',
      NEXT_PUBLIC_TRANSACTION_API_BASE: process.env.NEXT_PUBLIC_TRANSACTION_API_BASE || '',
      NEXT_PUBLIC_ESCROW_API_URL: process.env.NEXT_PUBLIC_ESCROW_API_URL || '',
      NEXT_PUBLIC_AUDIT_API_URL: process.env.NEXT_PUBLIC_AUDIT_API_URL || '',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
      NEXT_PUBLIC_LENDING_API_URL: process.env.NEXT_PUBLIC_LENDING_API_URL || '',
    }),
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy the audit service to avoid browser CORS failures in dev.
      '/audit-proxy': {
        target: 'https://audit.movasafe.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/audit-proxy/, ''),
      },
      // Proxy the lending service (https://loan.movasafe.com) to avoid CORS in dev.
      '/lending-proxy': {
        target: process.env.LENDING_PROXY_TARGET || 'https://loan.movasafe.com',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/lending-proxy/, ''),
      },
    },
  },
})
