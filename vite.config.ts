import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const rootDir = import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Beauty on Point Cosmetics ERP & POS',
        short_name: 'Beauty on Point',
        description: 'AI-powered cosmetics shop ERP and point of sale.',
        theme_color: '#ec2b77',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Without this, opening a deep link (e.g. /sales) or refreshing on
        // any route other than "/" fails while offline — Workbox has no
        // cached response for that exact URL. This tells it to fall back
        // to the cached app shell for any navigation request instead.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/(?:api|functions)\//],
        runtimeCaching: [
          {
            // Product photos and logos: cache what's been seen so they
            // still render offline, but don't let this grow unbounded.
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('recharts')) return 'charts'
          if (
            id.includes('@tanstack') ||
            id.includes('dexie') ||
            id.includes('@supabase')
          )
            return 'data'
          if (id.includes('node_modules/react') || id.includes('react-router-dom')) return 'vendor'
        },
      },
    },
  },
})
