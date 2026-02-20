import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split each major dependency into its own chunk
            const name = id.split('node_modules/')[1].split('/')[0];
            return `vendor/${name}`;
          }
        },
      },
    },
  },
});