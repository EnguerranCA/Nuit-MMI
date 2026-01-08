/**
 * 🎮 GameManager - Gestionnaire principal du jeu
 * Gère l'enchaînement des mini-jeux, les transitions, les tutoriels et les scores
 */

class GameManager {
    constructor() {
        // État du jeu
        this.state = {
            currentScreen: 'loading', // loading, menu, tutorial, game, transition, gameover
            currentGame: null,
            currentGameIndex: 0,
            score: 0,
            level: 1,
            gamesSequence: [], // Liste des jeux à jouer
            isSeriesMode: false // Mode série ou partie rapide
        };

        // Références aux éléments DOM
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            tutorial: document.getElementById('tutorial-screen'),
            game: document.getElementById('game-container'),
            transition: document.getElementById('transition-screen'),
            gameover: document.getElementById('gameover-screen')
        };

        // Références aux boutons
        this.buttons = {
            start: document.getElementById('btn-start'),
            leaderboard: document.getElementById('btn-leaderboard'),
            startGame: document.getElementById('btn-start-game'),
            restart: document.getElementById('btn-restart'),
            menu: document.getElementById('btn-menu')
        };

        // HUD elements
        this.hud = {
            score: document.getElementById('score-display'),
            level: document.getElementById('level-display')
        };

        // Registry des mini-jeux
        this.gamesRegistry = {};

        // Initialisation
        this.init();
    }

    /**
     * Initialisation du GameManager
     */
    async init() {
        console.log('GameManager - Initialisation...');
        
        // Chargement des mini-jeux
        await this.loadGames();
        
        // Configuration des event listeners
        this.setupEventListeners();
        
        // Affichage du menu après un court délai
        setTimeout(() => {
            this.showScreen('menu');
        }, 1500);
    }

    /**
     * Chargement dynamique des mini-jeux
     */
    async loadGames() {
        try {
            // Import dynamique du premier mini-jeu
            const { WallShapesGame } = await import('./games/wall-shapes/WallShapesGame.js');
            this.registerGame('wall-shapes', WallShapesGame);
            
            console.log('✅ Mini-jeux chargés:', Object.keys(this.gamesRegistry));
        } catch (error) {
            console.error('❌ Erreur de chargement des jeux:', error);
        }
    }

    /**
     * Enregistrement d'un mini-jeu dans le registry
     */
    registerGame(id, GameClass) {
        this.gamesRegistry[id] = GameClass;
        console.log(`✅ Jeu enregistré: ${id}`);
    }

    /**
     * Configuration des event listeners
     */
    setupEventListeners() {
        // Bouton démarrer
        this.buttons.start.addEventListener('click', () => {
            this.startGameSession();
        });

        // Bouton classement
        this.buttons.leaderboard.addEventListener('click', () => {
            console.log('📊 Affichage du classement (à implémenter)');
        });

        // Bouton Let's Go (après tutoriel)
        this.buttons.startGame.addEventListener('click', () => {
            this.startCurrentGame();
        });

        // Bouton rejouer
        this.buttons.restart.addEventListener('click', () => {
            this.restartGameSession();
        });

        // Bouton retour menu
        this.buttons.menu.addEventListener('click', () => {
            this.backToMenu();
        });
    }

    /**
     * Affichage d'un écran spécifique
     */
    showScreen(screenName) {
        // Masquer tous les écrans
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
        });

        // Afficher l'écran demandé
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.state.currentScreen = screenName;
            console.log(`📺 Écran affiché: ${screenName}`);
        }
    }

    /**
     * Démarrage d'une session de jeu
     */
    startGameSession() {
        console.log('🎮 Démarrage de la session de jeu');
        
        // Réinitialisation
        this.state.score = 0;
        this.state.level = 1;
        this.state.currentGameIndex = 0;
        
        // Pour l'instant, une seule partie avec le jeu des murs
        this.state.gamesSequence = ['wall-shapes'];
        
        // Affichage du tutoriel
        this.showTutorial();
    }

    /**
     * Affichage du tutoriel
     */
    showTutorial() {
        const gameId = this.state.gamesSequence[this.state.currentGameIndex];
        const GameClass = this.gamesRegistry[gameId];
        
        if (!GameClass) {
            console.error(`❌ Jeu introuvable: ${gameId}`);
            return;
        }

        // Récupération des infos du tutoriel
        const tutorialInfo = GameClass.getTutorial();
        
        // Mise à jour du contenu
        document.getElementById('tutorial-title').textContent = tutorialInfo.title;
        document.getElementById('tutorial-content').innerHTML = tutorialInfo.content;
        
        // Affichage
        this.showScreen('tutorial');
    }

    /**
     * Démarrage du jeu courant
     */
    async startCurrentGame() {
        const gameId = this.state.gamesSequence[this.state.currentGameIndex];
        const GameClass = this.gamesRegistry[gameId];
        
        console.log(`🎮 Démarrage du jeu: ${gameId}`);
        
        // Affichage de la zone de jeu
        this.showScreen('game');
        
        // Mise à jour du HUD
        this.updateHUD();
        
        // Création et initialisation du jeu
        this.state.currentGame = new GameClass(this);
        await this.state.currentGame.init();
        this.state.currentGame.start();
    }

    /**
     * Mise à jour du HUD
     */
    updateHUD() {
        this.hud.score.textContent = this.state.score;
        this.hud.level.textContent = this.state.level;
    }

    /**
     * Ajout de points au score
     */
    addScore(points) {
        this.state.score += points;
        this.updateHUD();
    }

    /**
     * Augmentation du niveau
     */
    increaseLevel() {
        this.state.level++;
        this.updateHUD();
    }

    /**
     * Fin du jeu en cours
     */
    endCurrentGame(finalScore, reason = 'completed') {
        console.log(`Fin du jeu. Score: ${finalScore}, Raison: ${reason}`);
        
        if (this.state.currentGame) {
            this.state.currentGame.cleanup();
            this.state.currentGame = null;
        }

        // Vérifier s'il y a d'autres jeux dans la séquence
        if (reason === 'completed' && this.state.currentGameIndex < this.state.gamesSequence.length - 1) {
            // Il y a un jeu suivant
            this.showTransition();
        } else if (reason === 'failed') {
            // Game over
            this.showGameOver();
        } else {
            // Fin de la séquence complète
            this.showGameOver();
        }
    }

    /**
     * Affichage de la transition entre jeux
     */
    showTransition() {
        document.getElementById('transition-text').textContent = 
            `Score: ${this.state.score} - Prochain jeu dans 3...`;
        
        this.showScreen('transition');
        
        // Passage au jeu suivant après 3 secondes
        setTimeout(() => {
            this.state.currentGameIndex++;
            this.showTutorial();
        }, 3000);
    }

    /**
     * Affichage de l'écran Game Over
     */
    showGameOver() {
        document.getElementById('final-score').textContent = this.state.score;
        this.showScreen('gameover');
    }

    /**
     * Redémarrage de la session
     */
    restartGameSession() {
        this.startGameSession();
    }

    /**
     * Retour au menu
     */
    backToMenu() {
        // Nettoyage du jeu en cours
        if (this.state.currentGame) {
            this.state.currentGame.cleanup();
            this.state.currentGame = null;
        }
        
        this.showScreen('menu');
    }
}

// Initialisation du GameManager au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
