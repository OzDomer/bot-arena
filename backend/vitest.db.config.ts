import { defineConfig } from 'vitest/config'
import { defaultServerConditions } from 'vite'

export default defineConfig({
  test: {
    include: ['src/**/*.db.test.ts'],
    env: {
      DATABASE_URL: 'postgres://user:1234@localhost:5432/bots_arena_test',
    },
    fileParallelism: false,
    setupFiles: "src/db/testSetup.ts"
},
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source'],
    },
  },
})