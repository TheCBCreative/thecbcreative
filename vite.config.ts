import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { devContactApi } from './scripts/dev-api.ts';

export default defineConfig({
  plugins: [tailwindcss(), devContactApi(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
