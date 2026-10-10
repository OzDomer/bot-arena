import { defaultExclude, defineConfig } from 'vitest/config'
import { defaultServerConditions } from 'vite'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgres://test:test@localhost:5432/test'
    },
    exclude: [...defaultExclude, "**/*.db.test.ts"]
  },
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source']
    }
  }
})