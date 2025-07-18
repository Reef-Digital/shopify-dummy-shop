import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"

// DO NOT import tailwindcss here!

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  base: '/shopify-dummy-shop/',
  define: {
    'process.env.NODE_ENV': JSON.stringify('dev'),
  },
  // No need for rollupOptions for a SPA/site build!
  build: {
    minify: false  // (optional; can remove if you want minification)
  }
})