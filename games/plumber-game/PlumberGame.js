/**
 * 🔧 Plumber Game - Répare les fuites !
 * Le joueur doit boucher les fuites d'eau avec ses mains détectées par la webcam
 * Utilise ML5 HandPose pour la détection de mains + touche espace pour réparer
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

export class PlumberGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // ML5 HandPose
        this.handPose = null;
        this.hands = [];
        this.videoCapture = null;
        
        // Groupes P5.play
        this.leaks = null;
        this.handSprites = null;
        this.handL = null;
        this.handR = null;
        
        // Gameplay
        this.gameState = "LOADING";
        this.leakSpawnRate = 120; // Frames entre chaque fuite
        this.waterLevel = 0;
        this.difficulty = 1;
        this.frameCounter = 0;
        
        // Référence P5
        this.p = null;
    }

    /**
     * Tutoriel du jeu
     */
    static getTutorial() {
        const content = TutorialSystem.generateHybridTutorial({
            title: 'Plumber Game',
            icon: '🔧',
            objective: 'Bouche les fuites d\'eau avec tes mains avant que la pièce ne soit inondée !',
            steps: [
                'Autorise l\'accès à ta webcam',
                'Connecte ton MakeyMakey (ou utilise la touche ESPACE)',
                'Place ta main sur une fuite (💧 devient ⚠️)',
                'Appuie sur ESPACE pour réparer la fuite',
                'Ne laisse pas le niveau d\'eau atteindre 100% !'
            ],
            tip: 'Travaille en équipe : un joueur place les mains, l\'autre appuie sur la touche !'
        });

        return {
            title: '🔧 Plumber Game',
            content: content
        };
    }

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🔧 PlumberGame - Initialisation');
        
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                this.p = p;
                
                p.setup = () => {
                    // Création du canvas
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    
                    // Initialisation de P5play
                    this.world = new p.World();
                    this.world.gravity.y = 0;
                    
                    // Configuration Vidéo
                    this.videoCapture = p.createCapture(p.VIDEO);
                    this.videoCapture.size(p.width, p.height);
                    this.videoCapture.hide();
                    
                    // Attendre que la vidéo soit prête
                    this.videoCapture.elt.addEventListener('loadeddata', () => {
                        // Initialisation de HandPose
                        this.handPose = ml5.handPose();
                        this.handPose.detectStart(this.videoCapture, (results) => {
                            this.hands = results;
                        });
                        
                        console.log('✅ HandPose chargé');
                    });
                    
                    // Configuration des Mains (Sprites)
                    this.handSprites = new p.Group();
                    this.handSprites.color = 'lime';
                    this.handSprites.d = 60;
                    this.handSprites.collider = 'kinematic';
                    this.handSprites.alpha = 0.8;
                    this.handSprites.stroke = 'limegreen';
                    this.handSprites.strokeWeight = 3;
                    
                    // Création des sprites des mains
                    this.handL = new this.handSprites.Sprite(-100, -100);
                    this.handR = new this.handSprites.Sprite(-100, -100);
                    this.handL.label = 'leftHand';
                    this.handR.label = 'rightHand';
                    
                    // Configuration des Fuites (Groupe)
                    this.leaks = new p.Group();
                    this.leaks.color = 'cyan';
                    this.leaks.stroke = 'blue';
                    this.leaks.strokeWeight = 4;
                    this.leaks.collider = 'static';
                    
                    resolve();
                };

                p.draw = () => {
                    this.update(p);
                };

                p.keyPressed = () => {
                    this.onKeyPressed(p.key);
                };
                
                p.windowResized = () => {
                    p.resizeCanvas(p.windowWidth, p.windowHeight);
                    if (this.videoCapture) {
                        this.videoCapture.size(p.width, p.height);
                    }
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
        console.log('▶️ PlumberGame - Démarrage');
        
        // Réinitialiser les variables
        this.score = 0;
        this.difficulty = 1;
        this.leakSpawnRate = 120;
        this.waterLevel = 0;
        this.gameState = "PLAYING";
        this.frameCounter = 0;
    }

    /**
     * Boucle de jeu
     */
    update(p) {
        if (!this.isRunning) return;
        
        this.frameCounter++;
        
        // --- FOND: MUR EN BRIQUE ---
        this.drawBrickWall(p);
        
        // --- DESSIN DE LA VIDEO (EFFET MIROIR) ---
        p.push();
        p.translate(p.width, 0);
        p.scale(-1, 1);
        p.tint(255, 255, 255, 100);
        p.image(this.videoCapture, 0, 0, p.width, p.height);
        p.pop();

        // Si le modèle n'a pas encore détecté de main, on attend
        if (this.hands.length === 0 && this.gameState === "LOADING") {
            p.fill(255);
            p.textSize(20);
            p.textAlign(p.CENTER);
            p.text("Chargement du modèle HandPose...", p.width/2, p.height/2);
            p.text("Placez vos mains devant la caméra", p.width/2, p.height/2 + 30);
            return;
        }
        this.gameState = "PLAYING";
        
        // --- VÉRIFIER GAME OVER ---
        if (this.waterLevel >= 100) {
            this.drawGameOver(p);
            this.end('failed');
            return;
        }

        // --- MISE A JOUR DES MAINS ---
        this.updateHands(p);
        
        // --- DESSINER LES KEYPOINTS DES MAINS ---
        this.drawHandKeypoints(p);

        // --- GESTION DES FUITES ---
        if (this.frameCounter % this.leakSpawnRate === 0) {
            this.createLeak(p);
            
            // Augmenter la difficulté progressivement
            if (this.score > 0 && this.score % 5 === 0) {
                this.difficulty = Math.floor(this.score / 5) + 1;
                this.leakSpawnRate = Math.max(30, 120 - (this.difficulty * 15));
            }
        }
        
        // Montée de l'eau
        if (this.leaks && this.leaks.length > 0) {
            this.waterLevel += this.leaks.length * 0.05;
            this.waterLevel = Math.min(100, this.waterLevel);
        }

        // Vérification des réparations
        if (this.leaks) {
            for (let i = this.leaks.length - 1; i >= 0; i--) {
                let leak = this.leaks[i];
                
                let handOnLeak = this.checkHandLeakCollision(this.handL, leak) || 
                                 this.checkHandLeakCollision(this.handR, leak);
                
                if (handOnLeak) {
                    leak.color = 'orange';
                    leak.stroke = 'red';
                    leak.text = "⚠️";
                    
                    // Vérifier si la touche espace est pressée
                    if (p.keyIsDown(32)) {
                        this.repairLeak(leak);
                    }
                } else {
                    leak.color = 'cyan';
                    leak.stroke = 'blue';
                    leak.text = "💧";
                }
            }
        }
        
        // --- DESSINER L'EAU QUI MONTE ---
        this.drawWater(p);

        // --- UI (Interface) ---
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.LEFT);
        p.text("Fuites réparées: " + this.score, 20, 40);
        p.text("Niveau: " + this.difficulty, 20, 70);
        
        p.fill(this.waterLevel >= 80 ? 'red' : this.waterLevel >= 50 ? 'orange' : 'white');
        p.text("Niveau d'eau: " + Math.floor(this.waterLevel) + "%", 20, 100);
        
        this.drawWaterBar(p);
        
        // Instructions
        p.textSize(16);
        p.fill(255, 255, 0);
        p.textAlign(p.CENTER);
        p.text("ESPACE pour réparer quand sur une fuite ⚠️", p.width/2, 40);
        
        // Feedback visuel des mains
        p.textSize(14);
        p.fill(this.handL && this.handL.visible ? 'lime' : '#666');
        p.text("Main G: " + (this.handL && this.handL.visible ? "✓ DÉTECTÉE" : "Non détectée"), 20, p.height - 20);
        
        p.fill(this.handR && this.handR.visible ? 'lime' : '#666');
        p.text("Main D: " + (this.handR && this.handR.visible ? "✓ DÉTECTÉE" : "Non détectée"), p.width - 220, p.height - 20);
    }

    /**
     * Nettoyage
     */
    cleanup() {
        console.log('🧹 PlumberGame - Nettoyage');
        
        // Arrêter HandPose
        if (this.handPose) {
            try {
                this.handPose.detectStop();
            } catch (e) {
                console.warn('Erreur arrêt HandPose:', e);
            }
            this.handPose = null;
        }
        
        // Arrêter la webcam
        if (this.videoCapture) {
            this.videoCapture.remove();
            this.videoCapture = null;
        }
        
        // Supprimer les sprites
        if (this.leaks) {
            try {
                this.leaks.removeAll();
            } catch (e) {
                console.warn('Erreur suppression fuites:', e);
            }
        }
        
        if (this.handSprites) {
            try {
                this.handSprites.removeAll();
            } catch (e) {
                console.warn('Erreur suppression mains:', e);
            }
        }
        
        this.hands = [];
        
        super.cleanup();
    }

    /**
     * Gestion des inputs clavier (MakeyMakey)
     */
    onKeyPressed(key) {
        super.onKeyPressed(key);
        
        // Redémarrage avec R (pour debug)
        if ((key === 'r' || key === 'R') && this.waterLevel >= 100) {
            this.score = 0;
            this.difficulty = 1;
            this.leakSpawnRate = 120;
            this.waterLevel = 0;
            this.gameState = "PLAYING";
            
            if (this.leaks) {
                this.leaks.removeAll();
            }
        }
    }

    // ==================== MÉTHODES PRIVÉES ====================

    /**
     * Dessiner un mur de briques
     */
    drawBrickWall(p) {
        let brickWidth = 80;
        let brickHeight = 40;
        
        for (let y = 0; y < p.height; y += brickHeight) {
            for (let x = 0; x < p.width; x += brickWidth) {
                let offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);
                
                let brickColor = p.color(180 + p.random(-20, 20), 80 + p.random(-10, 10), 60 + p.random(-10, 10));
                p.fill(brickColor);
                p.stroke(100, 50, 40);
                p.strokeWeight(2);
                
                p.rect(x + offset, y, brickWidth - 4, brickHeight - 4, 3);
            }
        }
    }

    /**
     * Dessiner l'eau qui monte
     */
    drawWater(p) {
        if (this.waterLevel > 0) {
            let waterHeight = p.map(this.waterLevel, 0, 100, 0, p.height);
            
            for (let i = 0; i < waterHeight; i += 5) {
                let alpha = p.map(i, 0, waterHeight, 150, 200);
                let blueShade = p.map(i, 0, waterHeight, 100, 180);
                p.fill(30, 100 + blueShade, 200, alpha);
                p.noStroke();
                p.rect(0, p.height - i, p.width, 5);
            }
            
            // Effet de vagues
            p.push();
            p.stroke(100, 150, 255, 150);
            p.strokeWeight(3);
            p.noFill();
            let waveY = p.height - waterHeight;
            p.beginShape();
            for (let x = 0; x <= p.width; x += 10) {
                let y = waveY + Math.sin((x + this.frameCounter) * 0.05) * 5;
                p.vertex(x, y);
            }
            p.endShape();
            p.pop();
        }
    }

    /**
     * Dessiner la barre de progression de l'eau
     */
    drawWaterBar(p) {
        let barX = 20;
        let barY = 130;
        let barWidth = 200;
        let barHeight = 20;
        
        p.fill(50);
        p.stroke(255);
        p.strokeWeight(2);
        p.rect(barX, barY, barWidth, barHeight, 5);
        
        let fillWidth = p.map(this.waterLevel, 0, 100, 0, barWidth);
        let barColor = this.waterLevel >= 80 ? p.color(255, 0, 0) : 
                       this.waterLevel >= 50 ? p.color(255, 165, 0) : 
                       p.color(30, 144, 255);
        p.fill(barColor);
        p.noStroke();
        p.rect(barX, barY, fillWidth, barHeight, 5);
    }

    /**
     * Vérifier collision main-fuite
     */
    checkHandLeakCollision(hand, leak) {
        if (!hand || !hand.visible) return false;
        
        let distance = Math.sqrt(
            Math.pow(hand.x - leak.x, 2) + 
            Math.pow(hand.y - leak.y, 2)
        );
        
        let handRadius = hand.d / 2;
        let leakRadius = leak.d / 2;
        
        return distance < (handRadius + leakRadius);
    }

    /**
     * Calculer le centre de la paume
     */
    getPalmCenter(keypoints) {
        let palmIndices = [0, 5, 9, 13, 17];
        let sumX = 0, sumY = 0, count = 0;
        
        for (let idx of palmIndices) {
            let kp = keypoints[idx];
            if (kp && kp.x && kp.y) {
                sumX += kp.x;
                sumY += kp.y;
                count++;
            }
        }
        
        if (count > 0) {
            return { x: sumX / count, y: sumY / count };
        }
        return null;
    }

    /**
     * Mettre à jour les positions des mains
     */
    updateHands(p) {
        if (this.hands.length > 0) {
            this.handL.visible = false;
            this.handR.visible = false;
            
            for (let hand of this.hands) {
                let palmCenter = this.getPalmCenter(hand.keypoints);
                
                if (palmCenter) {
                    let x = p.width - palmCenter.x;
                    let y = palmCenter.y;
                    
                    if (hand.handedness === "Left") {
                        this.handR.x = x;
                        this.handR.y = y;
                        this.handR.visible = true;
                    } else if (hand.handedness === "Right") {
                        this.handL.x = x;
                        this.handL.y = y;
                        this.handL.visible = true;
                    }
                }
            }
        } else {
            if (this.handL) this.handL.visible = false;
            if (this.handR) this.handR.visible = false;
        }
    }

    /**
     * Dessiner les keypoints des mains
     */
    drawHandKeypoints(p) {
        if (this.hands.length > 0) {
            for (let hand of this.hands) {
                for (let keypoint of hand.keypoints) {
                    if (keypoint && keypoint.x && keypoint.y) {
                        let x = p.width - keypoint.x;
                        let y = keypoint.y;
                        
                        p.push();
                        p.fill(0, 255, 0, 200);
                        p.noStroke();
                        p.circle(x, y, 8);
                        p.pop();
                    }
                }
                
                this.drawHandConnections(p, hand.keypoints);
            }
        }
    }

    /**
     * Dessiner les connexions entre les keypoints
     */
    drawHandConnections(p, keypoints) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];
        
        p.push();
        p.stroke(0, 255, 0, 150);
        p.strokeWeight(2);
        
        for (let conn of connections) {
            let kp1 = keypoints[conn[0]];
            let kp2 = keypoints[conn[1]];
            
            if (kp1 && kp2 && kp1.x && kp1.y && kp2.x && kp2.y) {
                let x1 = p.width - kp1.x;
                let y1 = kp1.y;
                let x2 = p.width - kp2.x;
                let y2 = kp2.y;
                
                p.line(x1, y1, x2, y2);
            }
        }
        p.pop();
    }

    /**
     * Créer une nouvelle fuite
     */
    createLeak(p) {
        if (!this.leaks) return;
        
        let leak = new this.leaks.Sprite();
        leak.x = p.random(80, p.width - 80);
        leak.y = p.random(80, p.height - 80);
        leak.d = 60;
        leak.text = "💧";
        leak.textSize = 35;
    }

    /**
     * Réparer une fuite
     */
    repairLeak(leak) {
        leak.remove();
        this.score++;
        this.addScore(10); // Ajouter au score global
        this.waterLevel = Math.max(0, this.waterLevel - 10);
    }

    /**
     * Écran Game Over
     */
    drawGameOver(p) {
        p.background(0, 50, 100);
        this.drawWater(p);
        
        p.fill(255, 0, 0);
        p.textSize(60);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("NOYÉ! 🌊", p.width/2, p.height/2 - 50);
        
        p.fill(255);
        p.textSize(30);
        p.text("Score final: " + this.score, p.width/2, p.height/2 + 20);
        p.text("Niveau atteint: " + this.difficulty, p.width/2, p.height/2 + 60);
    }
}
