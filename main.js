/**
 * 🎮 GameManager - Gestionnaire principal du jeu
 * Gère l'enchaînement des mini-jeux, les transitions, les tutoriels et les scores
 */

import gsap from 'gsap';

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
            gameover: document.getElementById('gameover-screen'),
            leaderboard: document.getElementById('leaderboard-screen')
        };

        // Références aux boutons
        this.buttons = {
            start: document.getElementById('btn-start'),
            leaderboard: document.getElementById('btn-leaderboard'),
            startGame: document.getElementById('btn-start-game'),
            restart: document.getElementById('btn-restart'),
            menu: document.getElementById('btn-menu'),
            saveScore: document.getElementById('btn-save-score'),
            backMenu: document.getElementById('btn-back-menu')
        };

        // HUD elements
        this.hud = {
            score: document.getElementById('score-display'),
            level: document.getElementById('level-display')
        };
        
        // API URL - utilise l'URL de production sur Vercel ou localhost en dev
        this.API_URL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api'
            : '/api';

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
            
            // Animer les éléments du menu après l'apparition
            gsap.from('#menu-screen h1', {
                scale: 0,
                rotation: -10,
                opacity: 0,
                duration: 0.8,
                delay: 0.3,
                ease: 'elastic.out(1, 0.5)',
                clearProps: 'all' // Nettoyer les propriétés inline après animation
            });
            
            gsap.from('#menu-screen button', {
                x: -100,
                opacity: 0,
                duration: 0.6,
                delay: 0.6,
                stagger: 0.15,
                ease: 'back.out(1.7)',
                clearProps: 'all'
            });
        }, 1500);
    }

    /**
     * Chargement dynamique des mini-jeux
     */
    async loadGames() {
        try {
            // Import dynamique des mini-jeux
            const { WallShapesGame } = await import('./games/wall-shapes/WallShapesGame.js');
            this.registerGame('wall-shapes', WallShapesGame);
            
            const { CowboyDuelGame } = await import('./games/cow-boy/CowboyDuelGame.js');
            this.registerGame('cow-boy', CowboyDuelGame);
            
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
            this.showLeaderboard();
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
        
        // Bouton sauvegarder le score
        this.buttons.saveScore.addEventListener('click', () => {
            this.savePlayerScore();
        });
        
        // Bouton retour menu depuis classement
        this.buttons.backMenu.addEventListener('click', () => {
            this.showScreen('menu');
        });
    }

    /**
     * Affichage d'un écran spécifique avec animations GSAP
     */
    showScreen(screenName) {
        const newScreen = this.screens[screenName];
        if (!newScreen) return;

        // Trouver l'écran actuellement visible
        const currentScreen = Object.entries(this.screens).find(([name, screen]) => 
            !screen.classList.contains('hidden')
        )?.[1];

        // Timeline GSAP pour l'animation
        const tl = gsap.timeline({
            onComplete: () => {
                this.state.currentScreen = screenName;
                console.log(`📺 Écran affiché: ${screenName}`);
            }
        });

        if (currentScreen && currentScreen !== newScreen) {
            // Animer la sortie de l'écran actuel
            tl.to(currentScreen, {
                opacity: 0,
                scale: 0.95,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    currentScreen.classList.add('hidden');
                    gsap.set(currentScreen, { opacity: 1, scale: 1 }); // Reset pour la prochaine fois
                }
            });
        }

        // Préparer le nouvel écran
        gsap.set(newScreen, { opacity: 0, scale: 1.05 });
        newScreen.classList.remove('hidden');

        // Animer l'entrée du nouvel écran
        tl.to(newScreen, {
            opacity: 1,
            scale: 1,
            duration: 0.4,
            ease: 'power2.out'
        }, currentScreen ? '-=0.1' : 0); // Légère superposition si transition depuis un autre écran
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
        
        // Séquence des mini-jeux
        this.state.gamesSequence = ['cow-boy'];
        
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
        
        // Affichage avec animations des éléments internes
        this.showScreen('tutorial');
        
        // Animer les éléments du tutoriel après l'apparition de l'écran
        gsap.from('#tutorial-title', {
            y: -30,
            opacity: 0,
            duration: 0.5,
            delay: 0.3,
            ease: 'back.out(1.7)',
            clearProps: 'all'
        });
        
        gsap.from('#tutorial-content', {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.4,
            ease: 'power2.out',
            clearProps: 'all'
        });
        
        gsap.from('#btn-start-game', {
            scale: 0,
            opacity: 0,
            duration: 0.5,
            delay: 0.6,
            ease: 'back.out(1.7)',
            clearProps: 'all'
        });
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
        
        // Animer l'apparition du HUD
        gsap.from('#game-hud-bottom > div', {
            y: 100,
            opacity: 0,
            duration: 0.6,
            delay: 0.4,
            stagger: 0.15,
            ease: 'back.out(1.7)',
            clearProps: 'all'
        });
        
        // Mise à jour du HUD
        this.updateHUD();
        
        // Création et initialisation du jeu
        this.state.currentGame = new GameClass(this);
        await this.state.currentGame.init();
        this.state.currentGame.start();
    }

    /**
     * Mise à jour du HUD avec animation
     */
    updateHUD() {
        // Animer le changement de valeur
        const scoreElement = this.hud.score;
        const levelElement = this.hud.level;
        
        const oldScore = parseInt(scoreElement.textContent) || 0;
        const oldLevel = parseInt(levelElement.textContent) || 0;
        
        // Animation du score
        if (this.state.score !== oldScore) {
            gsap.to({ value: oldScore }, {
                value: this.state.score,
                duration: 0.5,
                ease: 'power2.out',
                onUpdate: function() {
                    scoreElement.textContent = Math.round(this.targets()[0].value);
                }
            });
            
            // Petit effet de "pop"
            gsap.fromTo(scoreElement, 
                { scale: 1 },
                { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.inOut' }
            );
        }
        
        // Animation du niveau
        if (this.state.level !== oldLevel) {
            levelElement.textContent = this.state.level;
            gsap.fromTo(levelElement,
                { scale: 1 },
                { scale: 1.4, duration: 0.2, yoyo: true, repeat: 1, ease: 'back.out(1.7)' }
            );
        }
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
        
        // Animer les éléments de transition
        gsap.from('#transition-screen h2', {
            scale: 0,
            rotation: 360,
            opacity: 0,
            duration: 0.6,
            delay: 0.3,
            ease: 'back.out(2)',
            clearProps: 'all'
        });
        
        gsap.from('#transition-text', {
            y: 50,
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'all'
        });
        
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
        
        // Animer les éléments du game over
        gsap.from('#gameover-screen h2', {
            scale: 0,
            opacity: 0,
            duration: 0.6,
            delay: 0.3,
            ease: 'elastic.out(1, 0.5)',
            clearProps: 'all'
        });
        
        gsap.from('#gameover-screen > div', {
            y: 50,
            opacity: 0,
            duration: 0.5,
            delay: 0.5,
            ease: 'power2.out',
            clearProps: 'all'
        });
        
        gsap.from('#gameover-screen button', {
            scale: 0,
            opacity: 0,
            duration: 0.4,
            delay: 0.7,
            stagger: 0.1,
            ease: 'back.out(1.7)',
            clearProps: 'all'
        });
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
    
    /**
     * Sauvegarder le score du joueur
     */
    async savePlayerScore() {
        const pseudoInput = document.getElementById('pseudo-input');
        const saveMessage = document.getElementById('save-message');
        const pseudo = pseudoInput.value.trim();
        
        if (!pseudo) {
            saveMessage.textContent = '⚠️ Entrez un pseudo';
            saveMessage.className = 'text-sm text-center h-6 text-red-600';
            return;
        }
        
        try {
            const response = await fetch(`${this.API_URL}/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pseudo, score: this.state.score })
            });
            
            const result = await response.json();
            
            if (result.success) {
                if (result.new) {
                    saveMessage.textContent = 'Score enregistré !';
                    saveMessage.className = 'text-sm text-center h-6 text-green-600';
                } else if (result.updated) {
                    saveMessage.textContent = `Nouveau record ! (ancien: ${result.oldScore})`;
                    saveMessage.className = 'text-sm text-center h-6 text-green-600';
                } else {
                    saveMessage.textContent = 'Score mis à jour';
                    saveMessage.className = 'text-sm text-center h-6 text-blue-600';
                }
                
                // Désactiver le bouton après sauvegarde
                this.buttons.saveScore.disabled = true;
                this.buttons.saveScore.className += ' opacity-50 cursor-not-allowed';
            }
        } catch (error) {
            console.error('Erreur sauvegarde score:', error);
            saveMessage.textContent = '❌ Erreur serveur';
            saveMessage.className = 'text-sm text-center h-6 text-red-600';
        }
    }
    
    /**
     * Afficher le classement
     */
    async showLeaderboard() {
        this.showScreen('leaderboard');
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<p class="text-center text-gray-500">Chargement...</p>';
        
        try {
            const response = await fetch(`${this.API_URL}/leaderboard?limit=20`);
            const leaderboard = await response.json();
            
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<p class="text-center text-gray-500">Aucun score enregistré</p>';
                return;
            }
            
            leaderboardList.innerHTML = leaderboard.map((player, index) => `
                <div class="flex items-center justify-between p-4 ${
                    index === 0 ? 'bg-primary text-white' :
                    index === 1 ? 'bg-secondary text-text border-none' :
                    'bg-background'
                } rounded-2xl border-2 ${
                    index < 3 ? '' : 'border-gray-300'
                }">
                    <div class="flex items-center gap-4">
                        <span class="text-3xl font-outfit font-bold">
                            ${index + 1}
                        </span>
                        <span class="text-xl font-bold">
                            ${player.pseudo}
                        </span>
                    </div>
                    <span class="text-2xl font-outfit font-bold ${index < 3 ? '' : 'text-primary'}">
                        ${player.score}
                    </span>
                </div>
            `).join('');
            
            // Animer l'apparition des éléments
            gsap.from('#leaderboard-list > div', {
                x: -50,
                opacity: 0,
                duration: 0.4,
                stagger: 0.05,  
                ease: 'back.out(1.7)',
                clearProps: 'all'
            });
            
        } catch (error) {
            console.error('Erreur chargement classement:', error);
            leaderboardList.innerHTML = '<p class="text-center text-red-600">❌ Erreur de connexion au serveur</p>';
        }
    }
}

// Initialisation du GameManager au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
