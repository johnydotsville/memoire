import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    createHtmlPlugin({
      inject: {
        data: {
          title: 'memoire app'
        }
      }
    })
  ],
  base: './',
  build: {
    outDir: 'docs'
  },
})
