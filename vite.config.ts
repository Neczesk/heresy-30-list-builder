import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/heresy-30-list-builder/',
  define: {
    // Only expose specific environment variables that are safe for client-side
    'process.env': {},
  },
  // Ensure environment variables are not bundled unless explicitly needed
  envPrefix: 'VITE_',
});
