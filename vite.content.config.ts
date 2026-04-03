import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Build 2: content script as a single self-contained IIFE.
// Chrome content scripts cannot use ES module imports — everything must be
// inlined into one file. format:'iife' + inlineDynamicImports achieves this.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  define: {
    // Required for React to tree-shake dev-only code
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // don't wipe the popup build
    // Force all assets (woff2 fonts) to inline as base64 data URIs.
    // This keeps the content script fully self-contained with no external requests.
    assetsInlineLimit: 1_000_000,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/content/index.ts'),
      output: {
        format: 'iife',
        entryFileNames: 'src/content/index.js',
        // Inline every imported module — produces one single file with no imports
        inlineDynamicImports: true,
      },
    },
  },
})
