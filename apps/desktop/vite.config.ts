/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  server: {
    port: 3000,
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }],
          'babel-plugin-react-compiler'
        ],
      },
    }),
    svgr({
      svgrOptions: {
        exportType: 'default',
      },
    }),
  ],
  build: {
    target: ['es2020', 'safari13'],
    cssTarget: 'safari13',
    minify: 'esbuild',
    rollupOptions: {},
  },
  resolve: {
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
  },
  test: {
    environment: 'happy-dom',
    reporters: ['verbose'],
  },
})
