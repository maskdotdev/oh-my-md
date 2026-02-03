import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import solidPlugin from 'vite-plugin-solid'

import lucidePreprocess from 'vite-plugin-lucide-preprocess'

export default defineConfig({
  plugins: [
    lucidePreprocess(),
    devtools(),
    tanstackRouter({ target: 'solid' }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    solidPlugin(),
  ],
})
