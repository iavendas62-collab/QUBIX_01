import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    
    // Define environment variables for the client
    define: {
      // Em desenvolvimento: proxy do Vite (/api)
      // Em produção (Railway): string vazia pois frontend/backend no mesmo domínio
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || (env.NODE_ENV === 'production' ? '' : '/api')),
      'import.meta.env.VITE_WS_URL': JSON.stringify(env.VITE_WS_URL || (env.NODE_ENV === 'production' ? 'wss://qubix.io/ws' : 'ws://localhost:3006')),
      // Force production detection for Railway
      'import.meta.env.PROD': JSON.stringify(env.NODE_ENV === 'production'),
    },

    // Development server configuration
    server: {
      port: 3004,
      proxy: {
        '/api': {
          target: 'http://localhost:3006',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:3006',
          ws: true
        }
      }
    },
    
    // Production build configuration
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
          }
        }
      }
    }
  };
});
