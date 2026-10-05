import { defineConfig, defaultClientConditions, defaultServerConditions } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true
  },
  resolve: {
    conditions: [...defaultClientConditions, '@arena/source']
  },
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source']
    }
  }
})