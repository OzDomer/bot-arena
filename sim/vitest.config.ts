import { defineConfig } from 'vitest/config'
import { defaultServerConditions } from 'vite'

export default defineConfig({
  ssr: {
    resolve: {
      conditions: [...defaultServerConditions, '@arena/source']
    }
  }
})