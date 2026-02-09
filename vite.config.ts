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
    }),
  },
  server: {
    port: 3000,
  },
})
