/**
 * Template de Mini-Jeu
 * Copie ce fichier et renomme-le pour créer un nouveau jeu
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class TemplateGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // Tes variables spécifiques au jeu ici
        this.exampleVariable = 0;
    }

    /**
     * Tutoriel du jeu
     */
    static getTutorial() {
        const content = TutorialSystem.generateML5Tutorial({
            title: 'Nom de ton jeu',
            objective: 'Décris l\'objectif principal du jeu',
            steps: [
                'Étape 1 : Fais ceci',
                'Étape 2 : Fais cela',
                'Étape 3 : Termine comme ça'
            ],
            tip: 'Une astuce utile pour le joueur'
        });

        return {
            title: 'Nom de ton jeu',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('TemplateGame - Initialisation');
        
        return new Promise((resolve) => {
            const sketch = (p) => {
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play (optionnel)
                    this.world = new p.World();
                    this.world.gravity.y = 0;
                    
                    // Ton code d'initialisation ici
                    
                    resolve();
                };

                p.draw = () => {
                    this.update(p);
                };

                p.keyPressed = () => {
                    this.onKeyPressed(p.key);
                };
            };

            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Démarrage du jeu
     */
    start() {
        super.start();
        console.log('TemplateGame - Démarrage');
        
        // Ton code de démarrage ici
    }

    /**
     * Boucle de jeu (appelée à chaque frame)
     */
    update(p) {
        if (!this.isRunning) return;

        // Fond
        p.background(242, 238, 229); // Beige Kawaii
        
        // Affiche quelque chose sur l'écran
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(32);
        p.text('Template Game Running', p.width / 2, p.height / 2);
        
        // Ta logique de jeu ici
        // ...
        
        // Conditions de victoire/défaite
        // Exemple : if (condition de victoire) this.end('completed', this.score);
        // Exemple : if (condition de défaite) this.end('failed', this.score);
    }

    /**
     * Nettoyage spécifique à ce jeu
     */
    cleanup() {
        console.log('TemplateGame - Nettoyage');
        
        // Nettoyage de tes ressources spécifiques ici
        // (webcam, ML5, etc.)
        
        // Appel du nettoyage de base
        super.cleanup();
    }

    /**
     * Gestion des inputs clavier (MakeyMakey)
     */
    onKeyPressed(key) {
        super.onKeyPressed(key);
        
        // Gestion des touches spécifiques
        console.log('Touche pressée:', key);
    }
}
