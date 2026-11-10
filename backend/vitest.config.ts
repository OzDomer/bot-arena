import { defaultExclude, defineConfig } from 'vitest/config'
import { defaultServerConditions } from 'vite'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test',
      CORS_ORIGIN: 'http://localhost:5173',
      JWT_SECRET: 'test-secret-test-secret-test-secret-0123',
    },
    exclude: [...defaultExclude, "**/*.db.test.ts"]
  },
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source']
    }
  }
})