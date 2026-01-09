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

        // Sons globaux (utilise l'API Audio HTML5)
        this.sounds = {
            defeat: new Audio('./sound/defeat.mp3'),
            success: new Audio('./sound/success.mp3')
        };
        // Précharger les sons
        this.sounds.defeat.preload = 'auto';
        this.sounds.success.preload = 'auto';

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
            backMenu: document.getElementById('btn-back-menu'),
            hudMenu: document.getElementById('btn-hud-menu')
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
        
        // Générer la galerie des jeux
        this.populateGameGallery();
        
        // Configuration des event listeners
        this.setupEventListeners();
        
        // Affichage du menu après un court délai
        setTimeout(() => {
            this.showScreen('menu');

            // Timeline orchestrée pour le menu
            const menuTl = gsap.timeline();

            // Blobs décoratifs - apparition douce avec rotation
            menuTl.from('#menu-screen img', {
                scale: 0,
                rotation: -180,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'elastic.out(1, 0.4)'
            }, 0);

            // Bouton Play - apparition simple
            menuTl.from('#btn-start', {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                clearProps: 'opacity'
            }, 0.3);

            // Cartes de jeux - cascade élégante avec rebond
            menuTl.from('#gallery-games > div', {
                y: 80,
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: {
                    each: 0.1,
                    from: 'start'
                },
                ease: 'back.out(1.4)',
                clearProps: 'transform,opacity'  // Ne pas toucher au backgroundColor
            }, 0.5);

            // Bouton leaderboard - slide + rebond
            menuTl.from('#btn-leaderboard', {
                x: 80,
                y: 80,
                scale: 0.5,
                opacity: 0,
                duration: 0.8,
                ease: 'back.out(2)',
                onComplete: () => {
                    // Animation flottante continue
                    gsap.to('#btn-leaderboard', {
                        y: -8,
                        duration: 1.5,
                        repeat: -1,
                        yoyo: true,
                        ease: 'sine.inOut'
                    });
                }
            }, 0.9);

            // Hover animations sur les cartes
            document.querySelectorAll('#gallery-games > div').forEach(card => {
                card.addEventListener('mouseenter', () => {
                    gsap.to(card, {
                        scale: 1.05,
                        rotation: gsap.utils.random(-2, 2),
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                });
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        scale: 1,
                        rotation: 0,
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                });
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

            const { PlumberGame } = await import('./games/plumber-game/PlumberGame.js');
            this.registerGame('plumber', PlumberGame);
            
            const { CowboyDuelGame } = await import('./games/cow-boy/CowboyDuelGame.js');
            this.registerGame('cow-boy', CowboyDuelGame);
            
            const { ColorLinesGame } = await import('./games/color-lines/ColorLinesGame.js');
            this.registerGame('color-lines', ColorLinesGame);
            
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
     * Génère dynamiquement la liste des jeux disponibles
     */
    populateGameGallery() {
        const gallery = document.getElementById('gallery-games');
        if (!gallery) return;

        gallery.innerHTML = ''; // Vider la galerie

        // Couleurs pour chaque jeu
        const gameColors = {
            'wall-shapes': '#A3FF56',
            'plumber': '#54D8FF',
            'cow-boy': '#9755FF',
            'color-lines': '#FF3246'
        };

        // Noms affichés pour chaque jeu
        const gameNames = {
            'wall-shapes': 'Wall Shapes',
            'plumber': 'Fix The Leaks',
            'cow-boy': 'Cowboy Reflex',
            'color-lines': 'Color Lines'
        };

        Object.entries(this.gamesRegistry).forEach(([gameId, GameClass]) => {
            const color = gameColors[gameId] || '#FFB347';
            const displayName = gameNames[gameId] || gameId;
            
            const card = document.createElement('div');
            card.className = 'group p-3 rounded-[2rem] pb-4 shadow-lg transition-transform hover:-translate-y-1 cursor-pointer';
            card.style.backgroundColor = color;
            
            // Images pour chaque jeu avec styles personnalisés
            const gameImages = {
                'wall-shapes': { src: './assets/PersonIllustration2.png', style: 'width: 220px; height: auto;' },
                'plumber': { src: './assets/PersonIllustration3.png', style: 'width: 250px; height: auto;' },
                'cow-boy': { src: './assets/PersonIllustration1.png', style: 'width: 240px; height: auto;' },
                'color-lines': { src: './assets/PersonStar.png', style: 'width: 250px; height: auto; margin-top: 20px;' }
            };
            const imgData = gameImages[gameId] || null;
            card.innerHTML = `
                <div class="bg-[#F2F0E9] w-full h-40 rounded-2xl mb-3 relative overflow-hidden border-2 border-black/5 group-hover:border-black/10 transition-colors flex items-center justify-center">
                    ${imgData ? `<img src='${imgData.src}' alt='' style='${imgData.style}' class='object-contain pointer-events-none' />` : `<span class='text-4xl opacity-50 translate-60'>🎮</span>`}
                </div>
                <h2 class="text-black/80 font-lexend font-semibold text-lg uppercase tracking-wide ml-2">
                    ${displayName}
                </h2>
            `;
            card.addEventListener('click', () => {
                this.startSingleGame(gameId);
            });
            gallery.appendChild(card);
        });

        console.log('✅ Game gallery generated:', Object.keys(this.gamesRegistry));
    }

    /**
     * Démarre un jeu spécifique en mode partie rapide
     */
    startSingleGame(gameId) {
        console.log(`🎮 Démarrage partie rapide: ${gameId}`);
        
        // Réinitialisation
        this.state.score = 0;
        this.state.level = 1;
        this.state.currentGameIndex = 0;
        this.state.isSeriesMode = false;
        
        // Séquence avec un seul jeu
        this.state.gamesSequence = [gameId];
        
        // Affichage du tutoriel
        this.showTutorial();
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
        // Bouton retour menu depuis le HUD en jeu
        this.buttons.hudMenu.addEventListener('click', () => {
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
            // Animation de disparition fluide avec blur effect
            tl.to(currentScreen, {
                opacity: 0,
                scale: 0.85,
                y: 60,
                filter: 'blur(10px)',
                duration: 0.4,
                ease: 'power3.in',
                onComplete: () => {
                    currentScreen.classList.add('hidden');
                    gsap.set(currentScreen, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' });
                }
            });
        }

        // Préparer le nouvel écran
        gsap.set(newScreen, { opacity: 0, scale: 1.1, y: -50, filter: 'blur(8px)' });
        newScreen.classList.remove('hidden');

        // Animation d'apparition dynamique
        tl.to(newScreen, {
            opacity: 1,
            scale: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.6,
            ease: 'expo.out'
        }, currentScreen ? '-=0.15' : 0);
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
        this.state.isSeriesMode = true; // Mode série
        
        // Séquence des mini-jeux (tous les jeux)
        this.state.gamesSequence = ['wall-shapes', 'plumber', 'cow-boy'];
        
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
            `Score: ${this.state.score} - Next game in 3...`;
        
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
        
        // Jouer le son de défaite
        if (this.sounds.defeat) {
            this.sounds.defeat.volume = 0.7;
            this.sounds.defeat.currentTime = 0; // Remettre au début si déjà joué
            this.sounds.defeat.play().catch(e => console.log('Audio play error:', e));
        }
        
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
        if (this.state.isSeriesMode) {
            // En mode série, on relance toute la série
            this.startGameSession();
        } else {
            // En mode jeu libre, on relance le même jeu
            const currentGameId = this.state.gamesSequence[0];
            this.startSingleGame(currentGameId);
        }
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
            saveMessage.textContent = '⚠️ Enter a username';
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
                    saveMessage.textContent = 'Score saved!';
                    saveMessage.className = 'text-sm text-center h-6 text-green-600';
                } else if (result.updated) {
                    saveMessage.textContent = `New record! (previous: ${result.oldScore})`;
                    saveMessage.className = 'text-sm text-center h-6 text-green-600';
                } else {
                    saveMessage.textContent = 'Score updated';
                    saveMessage.className = 'text-sm text-center h-6 text-blue-600';
                }
                
                // Désactiver le bouton après sauvegarde
                this.buttons.saveScore.disabled = true;
                this.buttons.saveScore.className += ' opacity-50 cursor-not-allowed';
            }
        } catch (error) {
            console.error('Error saving score:', error);
            saveMessage.textContent = '❌ Server error';
            saveMessage.className = 'text-sm text-center h-6 text-red-600';
        }
    }
    
    /**
     * Afficher le classement
     */
    async showLeaderboard() {
        this.showScreen('leaderboard');
        
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '<p class="text-center text-gray-500">Loading...</p>';
        
        try {
            const response = await fetch(`${this.API_URL}/leaderboard?limit=20`);
            const leaderboard = await response.json();
            
            if (leaderboard.length === 0) {
                leaderboardList.innerHTML = '<p class="text-center text-gray-500">No scores recorded yet</p>';
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
            console.error('Error loading leaderboard:', error);
            leaderboardList.innerHTML = '<p class="text-center text-red-600">❌ Server connection error</p>';
        }
    }
}

// Initialisation du GameManager au chargement de la page
window.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
