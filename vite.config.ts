import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { copyFileSync, mkdirSync, readdirSync } from 'fs'

// Build 1: popup (index.html) + service worker
// Content script is built separately via vite.content.config.ts as an IIFE
// because content scripts cannot use ES module imports.
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-manifest-and-icons',
      closeBundle() {
        // Copy manifest
        copyFileSync('manifest.json', 'dist/manifest.json')

        // Copy icons/ → dist/icons/
        mkdirSync('dist/icons', { recursive: true })
        for (const file of readdirSync('icons')) {
          copyFileSync(`icons/${file}`, `dist/icons/${file}`)
        }
      },
    },
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'service-worker': path.resolve(__dirname, 'src/background/service-worker.ts'),
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === 'service-worker'
            ? 'src/background/service-worker.js'
            : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
