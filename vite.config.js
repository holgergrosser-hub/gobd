import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import inject from '@rollup/plugin-inject'
import polyfillNode from 'rollup-plugin-polyfill-node'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      buffer: 'buffer/',
      process: 'process/browser'
    }
  },
  optimizeDeps: {
    include: ['buffer', 'process']
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    rollupOptions: {
      plugins: [
        polyfillNode(),
        inject({
          Buffer: ['buffer', 'Buffer'],
          process: 'process'
        })
      ]
    }
  }
})
