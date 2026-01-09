/**
 * Script de copie des assets statiques vers dist/
 * Exécuté après vite build pour inclure les sons, fonts et images
 */

import { cpSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'dist');

// Dossiers à copier
const assetsToCopy = [
    { src: 'sound', dest: 'sound' },
    { src: 'fonts', dest: 'fonts' },
    { src: 'assets', dest: 'assets' },
    { src: 'games/cow-boy/image', dest: 'games/cow-boy/image' },
    { src: 'games/color-lines/image', dest: 'games/color-lines/image' },
    { src: 'games', dest: 'games', filter: (src) => !src.includes('node_modules') }
];

console.log('📦 Copie des assets statiques...');

for (const asset of assetsToCopy) {
    const srcPath = join(rootDir, asset.src);
    const destPath = join(distDir, asset.dest);
    
    if (existsSync(srcPath)) {
        try {
            // Créer le dossier parent si nécessaire
            const parentDir = dirname(destPath);
            if (!existsSync(parentDir)) {
                mkdirSync(parentDir, { recursive: true });
            }
            
            cpSync(srcPath, destPath, { 
                recursive: true,
                filter: asset.filter || (() => true)
            });
            console.log(`✅ ${asset.src} → dist/${asset.dest}`);
        } catch (error) {
            console.error(`❌ Erreur copie ${asset.src}:`, error.message);
        }
    } else {
        console.log(`⚠️ ${asset.src} n'existe pas, ignoré`);
    }
}

console.log('✨ Copie des assets terminée!');
