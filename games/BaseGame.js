/**
 * 🎮 Base Game Class
 * Classe de base pour tous les mini-jeux
 * Définit l'API standard que chaque jeu doit implémenter
 */

export class BaseGame {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.isRunning = false;
        this.score = 0;
        
        // Canvas P5.js (sera créé dans init)
        this.canvas = null;
        this.world = null;
    }

    /**
     * Méthode statique pour obtenir les informations du tutoriel
     * À surcharger dans chaque mini-jeu
     */
    static getTutorial() {
        return {
            title: '📋 Tutoriel',
            content: '<p>Instructions du jeu...</p>'
        };
    }

    /**
     * Initialisation du jeu (async pour charger des ressources)
     */
    async init() {
        console.log('🎮 BaseGame - Initialisation');
        // À surcharger dans les sous-classes
    }

    /**
     * Démarrage du jeu
     */
    start() {
        console.log('▶️ BaseGame - Démarrage');
        this.isRunning = true;
        // À surcharger dans les sous-classes
    }

    /**
     * Mise à jour du jeu (appelée à chaque frame)
     */
    update() {
        if (!this.isRunning) return;
        // À surcharger dans les sous-classes
    }

    /**
     * Pause du jeu
     */
    pause() {
        this.isRunning = false;
        console.log('⏸️ BaseGame - Pause');
    }

    /**
     * Reprise du jeu
     */
    resume() {
        this.isRunning = true;
        console.log('▶️ BaseGame - Reprise');
    }

    /**
     * Fin du jeu
     */
    end(reason = 'completed') {
        this.isRunning = false;
        console.log(`🏁 BaseGame - Fin (${reason})`);
        this.gameManager.endCurrentGame(this.score);
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        console.log('🧹 BaseGame - Nettoyage');
        
        // Suppression du canvas P5.js
        if (this.canvas) {
            this.canvas.remove();
            this.canvas = null;
        }
        
        // Nettoyage du monde P5play
        if (this.world) {
            this.world.sprites.removeAll();
            this.world = null;
        }

        // Arrêt de P5.js si actif
        if (window.p5Instance) {
            window.p5Instance.remove();
            window.p5Instance = null;
        }
    }

    /**
     * Récupération du score actuel
     */
    getScore() {
        return this.score;
    }

    /**
     * Ajout de points
     */
    addScore(points) {
        this.score += points;
        this.gameManager.addScore(points);
    }

    /**
     * Gestion des inputs MakeyMakey
     */
    onKeyPressed(key) {
        // À surcharger dans les sous-classes
        console.log(`⌨️ Touche pressée: ${key}`);
    }

    onKeyReleased(key) {
        // À surcharger dans les sous-classes
    }
}
