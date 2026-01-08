/**
 * 🤠 Cowboy Duel Game - Duel au Far West
 * Réflexes de tir avec détection de main (ML5) et espace pour tirer
 * Jeu infini jusqu'à échec, puis passage au jeu suivant
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class CowboyDuelGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // ML5 HandPose
        this.handPose = null;
        this.hands = [];
        this.videoCapture = null;
        
        // Images
        this.imgCowboy = null;
        this.imgTarget = null;
        this.imgGun = null;
        
        // État du jeu
        this.gamePhase = 'waiting'; // waiting, ready, draw, shooting, hit, miss
        this.phaseTimer = 0;
        
        // Viseur (position de la main)
        this.crosshair = { x: 0, y: 0 };
        
        // Cible (cowboy ennemi)
        this.target = { 
            x: 0, 
            y: 0, 
            width: 150, 
            height: 200,
            visible: false
        };
        
        // Jauge de temps
        this.timeGauge = 0;
        this.maxTime = 5; // 5 secondes au début
        this.timeDecrement = 0.5; // Diminue de 0.5s à chaque manche
        this.minTime = 1; // Temps minimum
        
        // Score
        this.round = 0;
        this.cowboysKilled = 0;
        
        // Transition volets
        this.shutterProgress = 0; // 0 = ouvert, 1 = fermé
        
        // Taille du hitbox pour toucher la cible
        this.hitboxPadding = 50;
    }

    /**
     * Informations du tutoriel
     */
    static getTutorial() {
        const content = TutorialSystem.generateHybridTutorial({
            title: 'Duel de Cowboy',
            objective: 'Dégaine plus vite que ton adversaire ! Vise avec ta main et tire avec ESPACE.',
            steps: [
                'Autorise l\'accès à ta webcam',
                'Place ta main devant la caméra pour contrôler le viseur',
                'Attends que les volets s\'ouvrent',
                'Quand le cowboy apparaît, vise-le rapidement',
                'Appuie sur ESPACE pour tirer',
                'La jauge se remplit, si elle est pleine tu as perdu !',
                'Chaque cowboy tué rapporte 100 points'
            ],
            tip: 'Plus tu élimines de cowboys, moins tu as de temps pour réagir. Reste concentré !'
        });

        return {
            title: 'Duel de Cowboy',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🤠 CowboyDuelGame - Initialisation');
        
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                p.preload = () => {
                    // Chargement des images
                    this.imgCowboy = p.loadImage('./games/cow-boy/image/cowboy.png');
                    this.imgTarget = p.loadImage('./games/cow-boy/image/target.png');
                    this.imgGun = p.loadImage('./games/cow-boy/image/gun first person.png');
                    
                    // Charger HandPose dans preload (recommandé par ML5)
                    this.handPose = ml5.handPose();
                };
                
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play
                    this.world = new p.World();
                    this.world.gravity.y = 0;
                    
                    // Initialisation de la webcam
                    this.videoCapture = p.createCapture(p.VIDEO);
                    this.videoCapture.size(640, 480);
                    this.videoCapture.hide();
                    
                    // Viseur initial au centre
                    this.crosshair = { x: p.width / 2, y: p.height / 2 };
                    
                    // Attendre que la vidéo soit prête
                    this.videoCapture.elt.addEventListener('loadeddata', () => {
                        // Démarrer la détection des mains
                        this.handPose.detectStart(this.videoCapture, (results) => {
                            this.hands = results;
                        });
                        
                        console.log('✅ HandPose détection démarrée');
                        resolve();
                    });
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
        console.log('▶️ CowboyDuelGame - Démarrage');
        
        // Démarrer la première manche
        this.startNewRound();
    }

    /**
     * Démarrer une nouvelle manche
     */
    startNewRound() {
        this.round++;
        this.gamePhase = 'waiting';
        this.phaseTimer = 0;
        this.shutterProgress = 0;
        this.timeGauge = 0;
        this.target.visible = false;
        
        // Calculer le temps disponible (diminue à chaque manche)
        this.maxTime = Math.max(this.minTime, 5 - (this.round - 1) * this.timeDecrement);
        
        console.log(`🤠 Manche ${this.round} - Temps: ${this.maxTime}s`);
    }

    /**
     * Mise à jour du jeu
     */
    update(p) {
        if (!this.isRunning) return;

        // Mise à jour de la position du viseur selon la main détectée
        this.updateCrosshair(p);
        
        // Dessiner le fond Far West
        this.drawBackground(p);
        
        // Gérer les phases du jeu
        this.updateGamePhase(p);
        
        // Dessiner les éléments du jeu
        this.drawGame(p);
        
        // Dessiner les volets (transition)
        this.drawShutters(p);
        
        // Dessiner le viseur
        this.drawCrosshair(p);
        
        // Dessiner l'overlay du pistolet
        this.drawGunOverlay(p);
        
        // Dessiner le HUD
        this.drawHUD(p);
        
        // DEBUG : Afficher la webcam et les points de la main
        this.drawDebug(p);
    }

    /**
     * Mise à jour de la position du viseur
     */
    updateCrosshair(p) {
        if (this.hands.length > 0 && this.hands[0].keypoints) {
            // Utiliser le bout de l'index pour viser
            const hand = this.hands[0];
            const indexTip = hand.keypoints.find(k => k.name === 'index_finger_tip');
            
            // Vérifier si l'index est détecté (confidence peut être undefined ou NaN dans ML5 v1)
            if (indexTip && indexTip.x !== undefined && indexTip.y !== undefined) {
                // Mapper la position de la main à l'écran
                // La webcam fait 640x480, on mappe à l'écran entier
                const mappedX = p.map(indexTip.x, 0, 640, p.width, 0); // Inversé car mirrored
                const mappedY = p.map(indexTip.y, 0, 480, 0, p.height);
                
                // Lissage du mouvement
                this.crosshair.x = p.lerp(this.crosshair.x, mappedX, 0.3);
                this.crosshair.y = p.lerp(this.crosshair.y, mappedY, 0.3);
            }
        }
    }

    /**
     * Mise à jour des phases du jeu
     */
    updateGamePhase(p) {
        this.phaseTimer++;
        
        switch (this.gamePhase) {
            case 'waiting':
                // Fermeture des volets
                this.shutterProgress = p.min(1, this.shutterProgress + 0.05);
                if (this.shutterProgress >= 1 && this.phaseTimer > 60) {
                    this.gamePhase = 'ready';
                    this.phaseTimer = 0;
                }
                break;
                
            case 'ready':
                // Afficher "GET READY" pendant 1-2 secondes aléatoires
                const readyDuration = p.random(60, 120);
                if (this.phaseTimer > readyDuration) {
                    this.gamePhase = 'draw';
                    this.phaseTimer = 0;
                    this.spawnTarget(p);
                }
                break;
                
            case 'draw':
                // Ouverture des volets
                this.shutterProgress = p.max(0, this.shutterProgress - 0.1);
                if (this.shutterProgress <= 0) {
                    this.gamePhase = 'shooting';
                    this.phaseTimer = 0;
                }
                break;
                
            case 'shooting':
                // La jauge se remplit
                this.timeGauge += 1 / 60; // Incrémente chaque frame (60fps)
                
                if (this.timeGauge >= this.maxTime) {
                    // Trop lent ! Game over
                    this.gamePhase = 'miss';
                    this.phaseTimer = 0;
                    console.log('💀 Trop lent !');
                }
                break;
                
            case 'hit':
                // Animation de victoire
                if (this.phaseTimer > 60) {
                    this.startNewRound();
                }
                break;
                
            case 'miss':
                // Animation de défaite puis fin
                if (this.phaseTimer > 90) {
                    this.end('completed', this.score);
                }
                break;
        }
    }

    /**
     * Faire apparaître la cible
     */
    spawnTarget(p) {
        // Position aléatoire mais centrée
        const marginX = p.width * 0.25;
        const marginY = p.height * 0.2;
        
        this.target.x = p.random(marginX, p.width - marginX - this.target.width);
        this.target.y = p.random(marginY, p.height - marginY - this.target.height);
        this.target.visible = true;
        
        console.log(`🎯 Cible à (${Math.round(this.target.x)}, ${Math.round(this.target.y)})`);
    }

    /**
     * Dessiner le fond Far West
     */
    drawBackground(p) {
        // Ciel
        p.background(135, 206, 235); // Bleu ciel
        
        // Sol (sable/terre)
        p.fill(194, 154, 108);
        p.noStroke();
        p.rect(0, p.height * 0.7, p.width, p.height * 0.3);
        
        // Ligne d'horizon
        p.stroke(139, 90, 43);
        p.strokeWeight(3);
        p.line(0, p.height * 0.7, p.width, p.height * 0.7);
        
        // Montagnes en arrière-plan
        p.fill(139, 90, 43);
        p.noStroke();
        p.triangle(p.width * 0.1, p.height * 0.7, p.width * 0.25, p.height * 0.4, p.width * 0.4, p.height * 0.7);
        p.triangle(p.width * 0.5, p.height * 0.7, p.width * 0.7, p.height * 0.35, p.width * 0.9, p.height * 0.7);
        
        // Soleil
        p.fill(255, 200, 50);
        p.noStroke();
        p.ellipse(p.width * 0.85, p.height * 0.15, 80, 80);
    }

    /**
     * Dessiner les éléments du jeu
     */
    drawGame(p) {
        // Dessiner la cible (cowboy ennemi)
        if (this.target.visible && this.imgCowboy) {
            p.image(this.imgCowboy, this.target.x, this.target.y, this.target.width, this.target.height);
        }
        
        // Afficher le texte selon la phase
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(64);
        p.fill(0);
        p.stroke(255);
        p.strokeWeight(4);
        
        if (this.gamePhase === 'ready') {
            p.text('GET READY...', p.width / 2, p.height / 2);
        } else if (this.gamePhase === 'hit') {
            p.fill(0, 150, 0);
            p.text('BANG!', p.width / 2, p.height / 2);
        } else if (this.gamePhase === 'miss') {
            p.fill(200, 0, 0);
            p.text('TOO SLOW!', p.width / 2, p.height / 2);
        }
    }

    /**
     * Dessiner les volets (transition yeux fermés)
     */
    drawShutters(p) {
        if (this.shutterProgress <= 0) return;
        
        const shutterHeight = (p.height / 2) * this.shutterProgress;
        
        p.fill(30, 20, 10);
        p.noStroke();
        
        // Volet haut
        p.rect(0, 0, p.width, shutterHeight);
        
        // Volet bas
        p.rect(0, p.height - shutterHeight, p.width, shutterHeight);
        
        // Bordures dorées
        p.stroke(180, 140, 60);
        p.strokeWeight(5);
        p.line(0, shutterHeight, p.width, shutterHeight);
        p.line(0, p.height - shutterHeight, p.width, p.height - shutterHeight);
    }

    /**
     * Dessiner le viseur (croix)
     */
    drawCrosshair(p) {
        const size = 40;
        const thickness = 4;
        
        p.stroke(255, 0, 0);
        p.strokeWeight(thickness);
        
        // Croix
        p.line(this.crosshair.x - size, this.crosshair.y, this.crosshair.x + size, this.crosshair.y);
        p.line(this.crosshair.x, this.crosshair.y - size, this.crosshair.x, this.crosshair.y + size);
        
        // Cercle central
        p.noFill();
        p.strokeWeight(2);
        p.ellipse(this.crosshair.x, this.crosshair.y, 20, 20);
        
        // Point central
        p.fill(255, 0, 0);
        p.noStroke();
        p.ellipse(this.crosshair.x, this.crosshair.y, 6, 6);
    }

    /**
     * Dessiner l'overlay du pistolet
     */
    drawGunOverlay(p) {
        if (this.imgGun) {
            // Le pistolet en bas de l'écran
            const gunWidth = p.width * 0.4;
            const gunHeight = gunWidth * (this.imgGun.height / this.imgGun.width);
            const gunX = (p.width - gunWidth) / 2;
            const gunY = p.height - gunHeight + 50; // Légèrement en dehors
            
            p.image(this.imgGun, gunX, gunY, gunWidth, gunHeight);
        }
    }

    /**
     * Dessiner le HUD (jauge, score)
     */
    drawHUD(p) {
        // Jauge de temps en bas
        if (this.gamePhase === 'shooting') {
            const gaugeWidth = p.width * 0.6;
            const gaugeHeight = 30;
            const gaugeX = (p.width - gaugeWidth) / 2;
            const gaugeY = p.height - 80;
            
            // Fond de la jauge
            p.fill(50);
            p.stroke(0);
            p.strokeWeight(3);
            p.rect(gaugeX, gaugeY, gaugeWidth, gaugeHeight, 10);
            
            // Remplissage (rouge si proche du max)
            const fillPercent = this.timeGauge / this.maxTime;
            const fillColor = p.lerpColor(p.color(0, 200, 0), p.color(255, 0, 0), fillPercent);
            p.fill(fillColor);
            p.noStroke();
            p.rect(gaugeX + 3, gaugeY + 3, (gaugeWidth - 6) * fillPercent, gaugeHeight - 6, 8);
            
            // Texte
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.noStroke();
            p.text(`TEMPS: ${(this.maxTime - this.timeGauge).toFixed(1)}s`, p.width / 2, gaugeY + gaugeHeight / 2);
        }
        
        // Manche actuelle
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(3);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(24);
        p.text(`Manche: ${this.round}`, 20, 20);
        p.text(`Cowboys: ${this.cowboysKilled}`, 20, 50);
    }

    /**
     * DEBUG : Afficher la webcam et les points de la main
     */
    drawDebug(p) {
        // Cadre de debug en haut à droite
        const debugWidth = 240;
        const debugHeight = 180;
        const debugX = p.width - debugWidth - 20;
        const debugY = 20;
        
        // Fond semi-transparent
        p.fill(0, 0, 0, 180);
        p.stroke(255, 255, 0);
        p.strokeWeight(2);
        p.rect(debugX - 10, debugY - 10, debugWidth + 20, debugHeight + 100, 10);
        
        // Afficher la webcam en miroir
        p.push();
        p.translate(debugX + debugWidth, debugY);
        p.scale(-1, 1);
        p.image(this.videoCapture, 0, 0, debugWidth, debugHeight);
        p.pop();
        
        // Dessiner les points de la main si détectés
        if (this.hands.length > 0 && this.hands[0].keypoints) {
            const hand = this.hands[0];
            
            // Dessiner chaque point
            p.push();
            p.translate(debugX + debugWidth, debugY);
            p.scale(-1, 1);
            
            for (const kp of hand.keypoints) {
                // Mapper les coordonnées (webcam 640x480 vers debug window)
                const x = p.map(kp.x, 0, 640, 0, debugWidth);
                const y = p.map(kp.y, 0, 480, 0, debugHeight);
                
                // Couleur selon la confiance
                if (kp.confidence > 0.5) {
                    p.fill(0, 255, 0);
                } else {
                    p.fill(255, 0, 0);
                }
                p.noStroke();
                p.ellipse(x, y, 8, 8);
                
                // Highlight l'index (utilisé pour viser)
                if (kp.name === 'index_finger_tip') {
                    p.noFill();
                    p.stroke(255, 255, 0);
                    p.strokeWeight(2);
                    p.ellipse(x, y, 20, 20);
                }
            }
            p.pop();
        }
        
        // Texte d'info
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(12);
        p.text(`DEBUG - HandPose`, debugX, debugY + debugHeight + 5);
        p.text(`Mains détectées: ${this.hands.length}`, debugX, debugY + debugHeight + 20);
        
        if (this.hands.length > 0 && this.hands[0].keypoints) {
            const indexTip = this.hands[0].keypoints.find(k => k.name === 'index_finger_tip');
            if (indexTip) {
                p.text(`Index: (${Math.round(indexTip.x)}, ${Math.round(indexTip.y)})`, debugX, debugY + debugHeight + 35);
                p.text(`Confiance: ${(indexTip.confidence * 100).toFixed(0)}%`, debugX, debugY + debugHeight + 50);
            }
        } else {
            p.fill(255, 100, 100);
            p.text(`Aucune main détectée!`, debugX, debugY + debugHeight + 35);
            p.text(`Placez votre main devant la caméra`, debugX, debugY + debugHeight + 50);
        }
        
        p.fill(255);
        p.text(`Viseur: (${Math.round(this.crosshair.x)}, ${Math.round(this.crosshair.y)})`, debugX, debugY + debugHeight + 65);
    }

    /**
     * Gestion des inputs (tir avec ESPACE)
     */
    onKeyPressed(key) {
        if (key === ' ' && this.gamePhase === 'shooting') {
            this.shoot();
        }
    }

    /**
     * Tirer
     */
    shoot() {
        console.log(`🔫 TIR à (${Math.round(this.crosshair.x)}, ${Math.round(this.crosshair.y)})`);
        
        // Vérifier si on touche la cible
        const hitX = this.crosshair.x >= this.target.x - this.hitboxPadding && 
                     this.crosshair.x <= this.target.x + this.target.width + this.hitboxPadding;
        const hitY = this.crosshair.y >= this.target.y - this.hitboxPadding && 
                     this.crosshair.y <= this.target.y + this.target.height + this.hitboxPadding;
        
        if (hitX && hitY) {
            // Touché !
            console.log('🎯 TOUCHÉ !');
            this.gamePhase = 'hit';
            this.phaseTimer = 0;
            this.cowboysKilled++;
            this.addScore(100);
            this.target.visible = false;
        } else {
            // Raté !
            console.log('❌ RATÉ !');
            this.gamePhase = 'miss';
            this.phaseTimer = 0;
        }
    }

    /**
     * Nettoyage
     */
    cleanup() {
        console.log('🧹 CowboyDuelGame - Nettoyage');
        
        try {
            // Arrêter la détection ML5
            if (this.handPose) {
                this.handPose.detectStop();
            }
            
            // Arrêter la webcam
            if (this.videoCapture) {
                this.videoCapture.remove();
            }
            
            // Supprimer l'instance P5
            if (window.p5Instance) {
                window.p5Instance.remove();
                window.p5Instance = null;
            }
            
            // Nettoyer le monde P5play
            if (this.world && this.world.sprites) {
                this.world.sprites.removeAll();
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du nettoyage CowboyDuelGame:', error);
        }
    }
}
