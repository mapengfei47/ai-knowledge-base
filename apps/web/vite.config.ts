import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // All workspace applications read the single root .env used by local Compose.
  envDir: '../../',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
