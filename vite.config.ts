import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3001,
    host: '0.0.0.0',
    watch: {
      // Ignorar cambios en archivos que no deberían causar recarga
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.env*']
    }
  },
  plugins: [react()],
  // Vite expone automáticamente variables que empiezan con VITE_
  // Las variables de entorno se acceden via import.meta.env.VITE_*
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  optimizeDeps: {
    include: ['javascript-lp-solver']
  }
});
