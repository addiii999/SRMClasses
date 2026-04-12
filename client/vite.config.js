import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  esbuild: {
    pure: ['console.log', 'console.debug'],
    drop: ['debugger'],
  },
  build: {
    sourcemap: false, // Disable source maps for production
    rollupOptions: {
      output: {
        // Code splitting: group vendor libraries into a separate chunk
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios', 'lucide-react'],
        },
      },
    },
  },
})
