import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import { tailwindClassPrefixer } from './tailwind.svelte.prefixer.js';
import tailwindConfig from './tailwind.config.cjs';
import tailwindGlobalClasses from './tailwind.svelte.globals.json';

// https://vitejs.dev/config/
export default defineConfig({
  root: __dirname,
  plugins: [
    eslintPlugin({
      'shouldLint': path => path.includes(__dirname) && ['.svelte', '.ts', '.js'].some(ext => path.endsWith(ext)),
    }),
    svelte({
      extensions: ['.svelte'],
      preprocess: [
        tailwindClassPrefixer({ prefix: tailwindConfig.prefix, globals: tailwindGlobalClasses }),
        sveltePreprocess({ postcss: true }),
      ],
      onwarn: (warning, handler) => {
        if (warning.code === 'css-unused-selector') return; //disable warning for unused selectors since will be removed anyway
        handler(warning);
      },
    }),
  ],
  build: {
    lib: {
      entry: './src/core.ts',
      name: 'simion.dev',
      formats: ['iife', 'amd'],
      fileName: 'bundled',
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
      },
    },
    sourcemap: true, //todo!
  },

  test: {
    includeSource: ['src/**/*{.js,.ts}', 'tailwind.svelte.prefixer.js'],
    environment: 'jsdom',
    setupFiles: ['./test/vitest.setup.js'],
  },
  server: {
    port: 3333,
  },
});
