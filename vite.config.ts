import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { purgeCSSPlugin } from '@fullhuman/postcss-purgecss'

// https://vite.dev/config/
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        purgeCSSPlugin({
    			content: ["./src/**/*.html", "./src/**/*.tsx", "./src/**/*.ts"],
    			keyframes: true,
    			variables: true
        })
      ]
    }
  },
  plugins: [react()],
})
