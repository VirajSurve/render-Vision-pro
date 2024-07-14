import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './src/index.jsx', // Adjust path as necessary
      },
    },
  },
});
