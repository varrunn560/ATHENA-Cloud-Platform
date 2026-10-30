import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/vault-api': {
        target: loadEnv(mode, process.cwd(), '').VITE_VAULT_API_BASE_URL || 'https://w5vwnekg26.execute-api.ap-south-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vault-api/, ''),
      },
      '/vault-s3': {
        target: 'https://athena-vault-cad.s3.ap-south-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/vault-s3/, ''),
      },
    },
  },
}))


