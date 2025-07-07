import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin(), tailwindcss(),],
  define: {
    'process.env.NODE_ENV': JSON.stringify('dev'),
  },
  build: {
    rollupOptions: {
      input: './src/main.jsx',
      output: {
        format: 'iife',
        name: 'MyWidget',       // Optional global name
        entryFileNames: 'my-widget.iife.js',
      },
    },
    minify: false,
  },
})
