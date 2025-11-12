
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  base: '/',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  },
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib')
    }
  }
});
