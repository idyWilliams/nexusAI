import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { crx } from '@crxjs/vite-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import manifest from './src/manifest.json'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  }
})
