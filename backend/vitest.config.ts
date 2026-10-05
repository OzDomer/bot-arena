import { defineConfig } from 'vitest/config'
import { defaultServerConditions } from 'vite'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test'
    }
  },
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source']
    }
  }
})