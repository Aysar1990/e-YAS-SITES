import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  define: {
    // Fix for libraries that use 'global'
    global: 'window',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal']
  },
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: ['localhost', '.trycloudflare.com'],
  },
  build: {
    // Increase chunk size warning limit (optional)
    chunkSizeWarningLimit: 1000,
    
    // Enable source maps for debugging (disable in production)
    sourcemap: false,
    
    // Rollup options for code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // ag-Grid (large library)
          'ag-grid': ['ag-grid-community', 'ag-grid-react'],
          
          // Supabase
          'supabase': ['@supabase/supabase-js'],
          
          // Charts
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          
          // Maps
          'maps': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          
          // 3D
          'three': ['three', '@react-three/fiber', '@react-three/drei'],
          
          // Utils
          'utils': ['date-fns', 'lodash', 'zustand'],
          
          // Excel processing
          'excel': ['xlsx', 'exceljs', 'xlsx-js-style'],
        },
        
        // Dynamic chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Minification options (using esbuild - faster than terser)
    minify: 'esbuild',
  },
})
