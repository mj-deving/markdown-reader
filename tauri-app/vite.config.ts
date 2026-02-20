import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Allow Vite to resolve imports from the parent src/ directory
  // (converter.ts, styles.ts are shared with the CLI)
  resolve: {
    alias: {
      '@cli': resolve(__dirname, '../src'),
    },
  },
  server: {
    // Must match devUrl in tauri.conf.json
    port: 1420,
    strictPort: true,
    fs: {
      // Allow serving files from the parent src/ directory
      allow: ['.', '../src'],
    },
  },
  // Tauri expects the output in dist/
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
})
