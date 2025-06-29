import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      // Hide source file paths for security
      sourcemap: false,
      rollupOptions: {
        output: {
          // Remove file paths from chunk names
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    server: command === 'serve' ? {
      // Proxy API requests to backend (development only)
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        }
      },
      // Improve caching behavior
      hmr: {
        overlay: false
      },
      // Add aggressive cache headers for development
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      },
      // Force reload on file changes
      watch: {
        usePolling: true
      }
    } : undefined,
    // Disable source maps in development for security
    esbuild: {
      sourcemap: false
    },
    // Add cache busting for development
    define: {
      __DEV__: !isProduction
    }
  };
});
