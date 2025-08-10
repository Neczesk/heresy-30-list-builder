import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/heresy-30-list-builder/',
  define: {
    // Expose environment variables to the client
    'process.env': {},
  },
});
