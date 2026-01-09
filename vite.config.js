import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        game: resolve(__dirname, 'game.html')
      }
    },
    // Copier les assets statiques
    copyPublicDir: true
  },
  // Assets statiques à copier tels quels
  publicDir: false,
  server: {
    port: 3000,
    open: '/game.html'
  },
  // Configuration pour servir les dossiers statiques
  assetsInclude: ['**/*.mp3', '**/*.ttf', '**/*.woff', '**/*.woff2', '**/*.png', '**/*.jpg', '**/*.gif']
});
