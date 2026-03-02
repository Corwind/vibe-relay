/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const resolve = {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve,
  test: {
    projects: [
      {
        resolve,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/test/__tests__/mock-websocket.test.ts'],
          globals: true,
          setupFiles: './src/test/setup.ts',
        },
      },
      {
        resolve,
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx', 'src/test/__tests__/mock-websocket.test.ts'],
          globals: true,
          setupFiles: './src/test/setup.ts',
          css: true,
        },
      },
    ],
  },
});
