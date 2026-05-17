import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (vs 'autoUpdate') makes the SW reach 'waiting' state when a
      // new version is found, so onNeedRefresh fires reliably and the in-app
      // update button can both detect AND install the new version on demand.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Manna — Daily Bread for Your Soul',
        short_name: 'Manna',
        description: 'Read scripture, learn through quizzes and memory verses, and explore history and prophecy in the King James Bible.',
        theme_color: '#D97706',
        background_color: '#FFFBEB',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024
      }
    })
  ],
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false
  }
});
