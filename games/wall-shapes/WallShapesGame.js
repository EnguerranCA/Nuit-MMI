/**
 * 🧱 Wall Shapes Game - Pose Wall
 * Le joueur doit reproduire la pose pour passer à travers le mur
 * Utilise ML5 BodyPose pour la détection de pose
 */

import { BaseGame } from '../BaseGame.js';
import { TutorialSystem } from '../TutorialSystem.js';

// Colors constants
const COLORS = {
    success: [74, 222, 128],
    danger: [248, 113, 113],
    warning: [251, 191, 36],
    primary: [255, 255, 255],
    skeleton: [255, 255, 255],
    wall: [60, 70, 90],
    wallEdge: [80, 90, 110],
    hole: [20, 25, 35]
};

// Predefined poses with realistic body keypoint detection
const POSE_TYPES = [
    // ===== EASY POSES (Level 1-5) =====
    {
        name: 'HANDS UP',
        description: 'Both hands straight up',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 50;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < nose.y) score += 50;
            }
            return score;
        }
    },
    {
        name: 'T-POSE',
        description: 'Arms straight out',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                const wristHeight = p.abs(leftWrist.y - centerY);
                const wristDist = p.abs(leftWrist.x - centerX);
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                const wristHeight = p.abs(rightWrist.y - centerY);
                const wristDist = p.abs(rightWrist.x - centerX);
                if (wristHeight < shoulderDist * 0.5 && wristDist > shoulderDist * 0.8) score += 50;
            }
            return score;
        }
    },
    {
        name: 'STAR',
        description: 'Arms and legs wide',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            // Priorité aux bras (70% du score) - les jambes sont un bonus (30%)
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < centerY) score += 35;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < centerY) score += 35;
            }
            // Jambes: bonus optionnel avec seuil de confiance très bas (0.1)
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.1 && rightAnkle.confidence > 0.1) {
                const ankleDist = p.dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
                if (ankleDist > shoulderDist * 1.0) score += 30; // Seuil réduit de 1.2 à 1.0
            } else {
                // Si jambes non détectées, donner des points bonus si les bras sont bien positionnés
                score += 10;
            }
            return score;
        }
    },
    {
        name: 'ONE HAND UP',
        description: 'Left hand up',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 100;
            }
            return score;
        }
    },
    {
        name: 'ARMS FORWARD',
        description: 'Both arms stretched forward',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftElbow = keypoints[7];
            const rightElbow = keypoints[8];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftElbow && leftElbow.confidence > 0.2) score += 50;
            if (rightElbow && rightElbow.confidence > 0.2) score += 50;
            return score;
        }
    },
    {
        name: 'STANDING TALL',
        description: 'Stand straight, arms down',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
            const hipCenterX = (leftHip.x + rightHip.x) / 2;
            
            if (p.abs(shoulderCenterX - hipCenterX) < shoulderDist * 0.5) {
                score += 100;
            }
            return score;
        }
    },
    {
        name: 'ARMS ON HIPS',
        description: 'Hands on your hips',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                if (p.dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.2) score += 50;
            }
            if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                if (p.dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.2) score += 50;
            }
            return score;
        }
    },
    {
        name: 'WIDE STANCE',
        description: 'Legs wide apart',
        difficulty: 1,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            const leftKnee = keypoints[13];
            const rightKnee = keypoints[14];
            const leftAnkle = keypoints[15];
            const rightAnkle = keypoints[16];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            
            // Méthode 1: Utiliser les hanches (plus fiable, 40 points)
            if (leftHip && rightHip && leftHip.confidence > 0.15 && rightHip.confidence > 0.15) {
                const hipDist = p.dist(leftHip.x, leftHip.y, rightHip.x, rightHip.y);
                if (hipDist > shoulderDist * 0.8) score += 40;
            }
            
            // Méthode 2: Utiliser les genoux (assez fiable, 30 points)
            if (leftKnee && rightKnee && leftKnee.confidence > 0.1 && rightKnee.confidence > 0.1) {
                const kneeDist = p.dist(leftKnee.x, leftKnee.y, rightKnee.x, rightKnee.y);
                if (kneeDist > shoulderDist * 1.2) score += 30;
            }
            
            // Méthode 3: Utiliser les chevilles (bonus si détectées, 30 points)
            if (leftAnkle && rightAnkle && leftAnkle.confidence > 0.1 && rightAnkle.confidence > 0.1) {
                const ankleDist = p.dist(leftAnkle.x, leftAnkle.y, rightAnkle.x, rightAnkle.y);
                if (ankleDist > shoulderDist * 1.3) score += 30;
            }
            
            // Si aucune jambe détectée mais hanches écartées, donner un score minimum
            if (score === 0 && leftHip && rightHip) {
                score = 50; // Score par défaut si posture debout
            }
            
            return p.min(100, score);
        }
    },
    
    // ===== HARD POSES (Level 6+) =====
    {
        name: 'LEFT ARM UP',
        description: 'Only left arm raised',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y < nose.y) score += 60;
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y > rightShoulder.y - shoulderDist * 0.5) score += 40;
            }
            return score;
        }
    },
    {
        name: 'RIGHT ARM UP',
        description: 'Only right arm raised',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!nose || !leftShoulder || !rightShoulder || nose.confidence < 0.3) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let score = 0;
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.y < nose.y) score += 60;
            }
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.y > leftShoulder.y - shoulderDist * 0.5) score += 40;
            }
            return score;
        }
    },
    {
        name: 'CROSS ARMS',
        description: 'Arms crossed over chest',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            
            if (!leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            const centerX = (leftShoulder.x + rightShoulder.x) / 2;
            const centerY = (leftShoulder.y + rightShoulder.y) / 2;
            
            let score = 0;
            if (leftWrist && leftWrist.confidence > 0.2) {
                if (leftWrist.x > centerX && p.abs(leftWrist.y - centerY) < shoulderDist * 1.2) {
                    score += 50;
                }
            }
            if (rightWrist && rightWrist.confidence > 0.2) {
                if (rightWrist.x < centerX && p.abs(rightWrist.y - centerY) < shoulderDist * 1.2) {
                    score += 50;
                }
            }
            return score;
        }
    },
    {
        name: 'SUPERHERO',
        description: 'One fist up, one on hip',
        difficulty: 3,
        checkPose: function(keypoints, p) {
            const nose = keypoints[0];
            const leftShoulder = keypoints[5];
            const rightShoulder = keypoints[6];
            const leftWrist = keypoints[9];
            const rightWrist = keypoints[10];
            const leftHip = keypoints[11];
            const rightHip = keypoints[12];
            
            if (!nose || !leftShoulder || !rightShoulder) return 0;
            
            const shoulderDist = p.dist(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
            if (shoulderDist < 20) return 0;
            
            let armUpScore = 0;
            let armDownScore = 0;
            
            if (leftWrist && leftWrist.confidence > 0.2 && leftWrist.y < nose.y) {
                armUpScore = 50;
                if (rightWrist && rightHip && rightWrist.confidence > 0.2 && rightHip.confidence > 0.2) {
                    if (p.dist(rightWrist.x, rightWrist.y, rightHip.x, rightHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            } else if (rightWrist && rightWrist.confidence > 0.2 && rightWrist.y < nose.y) {
                armUpScore = 50;
                if (leftWrist && leftHip && leftWrist.confidence > 0.2 && leftHip.confidence > 0.2) {
                    if (p.dist(leftWrist.x, leftWrist.y, leftHip.x, leftHip.y) < shoulderDist * 1.0) {
                        armDownScore = 50;
                    }
                }
            }
            return armUpScore + armDownScore;
        }
    }
];

export class WallShapesGame extends BaseGame {
    constructor(gameManager) {
        super(gameManager);
        
        // Police
        this.lexendFont = null;
        
        // ML5 BodyPose
        this.bodyPose = null;
        this.poses = [];
        this.videoCapture = null;
        this.connections = null;
        this.poseReady = false;
        this.previewGraphics = null;
        
        // Lissage des keypoints pour fluidité
        this.smoothedKeypoints = [];
        this.smoothingFactor = 0.25; // 0.1 = très lisse, 0.5 = réactif. 0.25 = bon équilibre
        this.minConfidence = 0.3; // Seuil de confiance minimum
        
        // Game state
        this.gamePhase = 'loading'; // loading, ready, playing, gameover
        this.level = 1;
        this.lives = 3;
        this.lastLevelScore = 0;
        
        // Game world
        this.wallSpeed = 1.5;
        this.wallSpawnTimer = 0;
        this.wallSpawnInterval = 180;
        this.lastPoseName = '';
        this.totalWallsSpawned = 0;
        
        // Walls
        this.activeWalls = [];
        
        // Feedback
        this.feedbackText = '';
        this.feedbackColor = null;
        this.feedbackTimer = 0;
        
        // HUD Element
        this.hudElement = null;
    }

    /**
     * Lissage temporel des keypoints avec lerp pour fluidité
     * Applique un filtre de lissage exponential moving average
     */
    smoothKeypoints(rawKeypoints, p) {
        if (!rawKeypoints || rawKeypoints.length === 0) return rawKeypoints;
        
        // Première frame : initialiser avec les valeurs brutes
        if (this.smoothedKeypoints.length !== rawKeypoints.length) {
            this.smoothedKeypoints = rawKeypoints.map(kp => ({
                x: kp.x,
                y: kp.y,
                confidence: kp.confidence,
                name: kp.name
            }));
            return this.smoothedKeypoints;
        }
        
        // Appliquer le lissage lerp sur chaque keypoint
        for (let i = 0; i < rawKeypoints.length; i++) {
            const raw = rawKeypoints[i];
            const smoothed = this.smoothedKeypoints[i];
            
            // Ne lisser que si confiance suffisante
            if (raw.confidence >= this.minConfidence) {
                // Facteur de lissage adaptatif basé sur la confiance
                // Plus la confiance est haute, plus on fait confiance à la nouvelle valeur
                const adaptiveFactor = this.smoothingFactor * (0.5 + raw.confidence * 0.5);
                
                smoothed.x = p.lerp(smoothed.x, raw.x, adaptiveFactor);
                smoothed.y = p.lerp(smoothed.y, raw.y, adaptiveFactor);
                smoothed.confidence = raw.confidence;
            } else if (raw.confidence > 0.1) {
                // Confiance faible : lissage plus fort pour éviter les sauts
                smoothed.x = p.lerp(smoothed.x, raw.x, this.smoothingFactor * 0.3);
                smoothed.y = p.lerp(smoothed.y, raw.y, this.smoothingFactor * 0.3);
                smoothed.confidence = raw.confidence;
            }
            // Si confiance < 0.1, on garde les anciennes valeurs
        }
        
        return this.smoothedKeypoints;
    }

    /**
     * Création du HUD HTML avec Tailwind
     */
    createHUD() {
        // Supprimer le HUD existant s'il y en a un
        this.removeHUD();
        
        // Créer le container HUD
        this.hudElement = document.createElement('div');
        this.hudElement.id = 'wall-shapes-hud';
        this.hudElement.className = 'absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none';
        
        this.hudElement.innerHTML = `
            <!-- Stats à gauche -->
            <div class="flex gap-3">
                <!-- Level -->
                <div class="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <span class="text-xs text-white/60 uppercase tracking-wider">Level</span>
                    <p id="ws-level" class="text-2xl font-bold text-amber-400">${this.level}</p>
                </div>
                <!-- Lives -->
                <div class="bg-black/60 backdrop-blur-md rounded-xl px-4 py-2 border border-white/10">
                    <span class="text-xs text-white/60 uppercase tracking-wider">Vies</span>
                    <p id="ws-lives" class="text-2xl font-bold text-red-400">${'❤️'.repeat(this.lives)}</p>
                </div>
            </div>
            
        `;
        
        // Ajouter au game-container
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(this.hudElement);
        }
    }

    /**
     * Mise à jour du HUD
     */
    updateHUDDisplay() {
        if (!this.hudElement) return;
        
        const levelEl = document.getElementById('ws-level');
        const livesEl = document.getElementById('ws-lives');
        const statusEl = document.getElementById('ws-status');
        
        if (levelEl) levelEl.textContent = this.level;
        if (livesEl) livesEl.textContent = '❤️'.repeat(Math.max(0, this.lives));

    }

    /**
     * Suppression du HUD
     */
    removeHUD() {
        if (this.hudElement) {
            this.hudElement.remove();
            this.hudElement = null;
        }
    }

    /**
     * Informations du tutoriel
     */
    static getTutorial() {
        const content = TutorialSystem.generateML5Tutorial({
            title: 'Pose Wall',
            objective: 'Reproduis la pose affichée sur le mur avant qu\'il n\'arrive pour passer à travers !',
            tip: 'Assure-toi d\'avoir un bon éclairage et suffisamment de recul pour que tout ton corps soit visible.'
        });

        return {
            title: 'Pose Wall',
            content: content
        };
    }


    // Suppression du chargement manuel de la police, géré par CSS/Google Fonts

    /**
     * Initialisation du jeu
     */
    async init() {
        console.log('🧱 WallShapesGame - Initialisation');
        return new Promise((resolve, reject) => {
            const sketch = (p) => {
                p.preload = () => {
                    // Charger BodyPose dans preload
                    this.bodyPose = ml5.bodyPose('MoveNet', {
                        modelType: 'SINGLEPOSE_LIGHTNING',
                        enableSmoothing: true,
                        flipped: false
                    });
                };
                p.setup = () => {
                    // Création du canvas plein écran
                    this.canvas = p.createCanvas(p.windowWidth, p.windowHeight);
                    this.canvas.parent('game-container');
                    this.previewGraphics = p.createGraphics(200, 150);
                    // Utiliser la police Outfit comme dans CowboyDuelGame
                    p.textFont('Outfit');
                    this.connections = this.bodyPose.getSkeleton();
                    // Initialisation de la webcam
                    this.videoCapture = p.createCapture(p.VIDEO, (stream) => {
                        if (stream) {
                            this.onCameraReady(p);
                        }
                    });
                    this.videoCapture.size(640, 480);
                    this.videoCapture.hide();
                    // Fallback si pas de stream après 2 secondes
                    setTimeout(() => {
                        if (this.gamePhase === 'loading') {
                            console.log('Camera timeout, trying to start anyway...');
                            this.onCameraReady(p);
                        }
                    }, 2000);
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
                };
            };
            window.p5Instance = new p5(sketch);
        });
    }

    /**
     * Camera ready callback
     */
    onCameraReady(p) {
        this.bodyPose.detectStart(this.videoCapture, (results) => {
            this.poses = results;
            if (this.poses.length > 0 && !this.poseReady) {
                this.poseReady = true;
                console.log('✅ Pose détectée - Prêt à jouer');
            }
        });
        // Ne pas écraser gamePhase si le jeu est déjà en cours
        if (this.gamePhase !== 'waiting_pose' && this.gamePhase !== 'playing') {
            this.gamePhase = 'ready';
        }
        console.log('✅ BodyPose détection démarrée, gamePhase:', this.gamePhase);
    }

    /**
     * Démarrage du jeu
     */
    start() {
        super.start();
        console.log('▶️ WallShapesGame - Démarrage');
        
        // Reset game state
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.lastLevelScore = 0;
        this.wallSpeed = 1.5;
        this.wallSpawnInterval = 180;
        this.activeWalls = [];
        this.wallSpawnTimer = 0; // Commencer à 0 - attendre la pose
        this.lastPoseName = '';
        this.totalWallsSpawned = 0;
        this.gamePhase = 'waiting_pose'; // Attendre que la pose soit détectée
        
        // Créer le HUD
        this.createHUD();
        
        console.log('🧱 État initial:', {
            isRunning: this.isRunning,
            gamePhase: this.gamePhase,
            poseReady: this.poseReady
        });
    }

    /**
     * Mise à jour du jeu
     */
    update(p) {
        // Mettre à jour le HUD
        this.updateHUDDisplay();
        
        // Log de débogage toutes les 60 frames (1 seconde)
        if (p.frameCount % 60 === 0) {
            console.log('🔄 Update state:', {
                frameCount: p.frameCount,
                gamePhase: this.gamePhase,
                isRunning: this.isRunning,
                poseReady: this.poseReady,
                posesCount: this.poses.length,
                wallsCount: this.activeWalls.length,
                wallSpawnTimer: this.wallSpawnTimer
            });
        }
        
        // Dessiner l'environnement
        this.drawEnvironment(p);
        
        let playerPose = this.poses.length > 0 ? this.poses[0] : null;
        
        // Phase d'attente de la pose
        if (this.gamePhase === 'waiting_pose' && this.isRunning) {
            // Afficher un message d'attente
            p.push();
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Outfit');
            p.textSize(24);
            p.textStyle(p.BOLD);
            p.text('En attente de détection de pose...', p.width/2, p.height/2 - 50);
            p.textSize(16);
            p.textStyle(p.NORMAL);
            p.fill(200);
            p.text('Placez-vous devant la caméra', p.width/2, p.height/2);
            p.pop();
            
            // Passer en mode playing dès que poseReady est true
            if (this.poseReady) {
                console.log('🎮 Pose détectée, démarrage du jeu !');
                this.gamePhase = 'playing';
                this.wallSpawnTimer = 60; // Premier mur après 1 seconde
            }
        }
        
        if (this.gamePhase === 'playing' && this.isRunning) {
            this.wallSpawnTimer++;
            if (this.wallSpawnTimer >= this.wallSpawnInterval) {
                this.spawnWall(p);
                this.wallSpawnTimer = 0;
            }
            
            // Sort walls by distance
            this.activeWalls.sort((a, b) => b.z - a.z);
            
            // Update and draw walls
            for (let i = this.activeWalls.length - 1; i >= 0; i--) {
                let wall = this.activeWalls[i];
                wall.update(this.wallSpeed);
                wall.draw(p, playerPose);
                
                if (wall.isAtPlayer() && !wall.scored) {
                    wall.scored = true;
                    const isMatch = wall.checkBodyMatch(p, playerPose);
                    if (isMatch) {
                        const points = Math.floor(wall.matchScore);
                        this.addScore(points);
                        
                        if (wall.matchScore >= 95) {
                            this.showFeedback(p, 'PERFECT! +' + points, p.color(...COLORS.success));
                        } else {
                            this.showFeedback(p, 'GOOD! +' + points, p.color(...COLORS.warning));
                        }
                    } else {
                        this.lives--;
                        this.showFeedback(p, 'MISS', p.color(...COLORS.danger));
                        if (this.lives <= 0) {
                            this.gameOver();
                        }
                    }
                }
                
                if (wall.hasPassed()) {
                    this.activeWalls.splice(i, 1);
                }
            }
            
            // Level up
            if (this.score >= this.lastLevelScore + 400) {
                this.levelUp(p);
            }
            
            this.drawWallIndicator(p);
        }
        
        // Dessiner le squelette PAR DESSUS les murs
        if (playerPose && this.gamePhase === 'playing') {
            this.drawStickman(p, playerPose);
        }
        
        // Draw feedback
        this.drawFeedback(p);
        
        // Draw webcam preview
        if (this.videoCapture) {
            this.drawWebcamPreview(p, playerPose);
        }
        
        // Le HUD est maintenant en HTML/Tailwind (voir updateHUDDisplay)
    }

    /**
     * Dessiner l'environnement
     */
    drawEnvironment(p) {
        p.background(15, 18, 25);
        
        p.noStroke();
        for (let i = 0; i < 5; i++) {
            let alpha = 20 - i * 4;
            p.fill(40, 60, 100, alpha);
            p.ellipse(p.width/2, p.height * 0.45, 600 + i * 100, 30 + i * 10);
        }
        
        this.drawPlatform(p);
    }

    /**
     * Dessiner la plateforme
     */
    drawPlatform(p) {
        p.push();
        
        const horizonY = p.height * 0.45;
        const bottomY = p.height;
        const farW = 120;
        const nearW = 700;
        
        p.noStroke();
        p.fill(50, 55, 65);
        p.beginShape();
        p.vertex(p.width/2 - farW/2, horizonY);
        p.vertex(p.width/2 + farW/2, horizonY);
        p.vertex(p.width/2 + nearW/2, bottomY);
        p.vertex(p.width/2 - nearW/2, bottomY);
        p.endShape(p.CLOSE);
        
        p.stroke(80, 90, 110);
        p.strokeWeight(3);
        p.line(p.width/2 - farW/2, horizonY, p.width/2 - nearW/2, bottomY);
        p.line(p.width/2 + farW/2, horizonY, p.width/2 + nearW/2, bottomY);
        
        p.stroke(180, 180, 100, 150);
        p.strokeWeight(4);
        for (let i = 0; i < 12; i++) {
            let t1 = i / 12;
            let t2 = (i + 0.4) / 12;
            let y1 = p.lerp(horizonY, bottomY, t1);
            let y2 = p.lerp(horizonY, bottomY, t2);
            p.line(p.width/2, y1, p.width/2, y2);
        }
        
        p.stroke(60, 65, 75, 80);
        p.strokeWeight(1);
        for (let i = 1; i < 10; i++) {
            let t = Math.pow(i / 10, 1.5);
            let y = p.lerp(horizonY, bottomY, t);
            let w = p.lerp(farW, nearW, t);
            p.line(p.width/2 - w/2, y, p.width/2 + w/2, y);
        }
        
        p.pop();
    }

    /**
     * Dessiner le stickman du joueur avec lissage temporel
     */
    drawStickman(p, pose) {
        if (!pose || !this.connections) return;
        
        // Appliquer le lissage temporel sur les keypoints
        const smoothedKeypoints = this.smoothKeypoints(pose.keypoints, p);
        
        p.push();
        
        // La vidéo est en 640x480
        const videoWidth = 640;
        const videoHeight = 480;
        
        // Calculer le scale pour que le squelette prenne une bonne partie de l'écran
        // mais soit centré
        const targetWidth = p.width * 0.6; // Le squelette prend 60% de la largeur
        const targetHeight = p.height * 0.8; // Et 80% de la hauteur
        
        const scaleX = targetWidth / videoWidth;
        const scaleY = targetHeight / videoHeight;
        const scale = Math.min(scaleX, scaleY); // Garder les proportions
        
        // Centrer le squelette
        const scaledWidth = videoWidth * scale;
        const scaledHeight = videoHeight * scale;
        const offsetX = (p.width - scaledWidth) / 2;
        const offsetY = (p.height - scaledHeight) / 2;
        
        // Utiliser les keypoints lissés avec seuil de confiance amélioré
        const getPos = (keypoint) => {
            // Seuil de confiance augmenté à 0.2 (était 0.1) pour filtrer les détections erratiques
            if (!keypoint || keypoint.confidence < 0.2) return null;
            // Miroir horizontal (la vidéo est inversée)
            return {
                x: (videoWidth - keypoint.x) * scale + offsetX,
                y: keypoint.y * scale + offsetY,
                confidence: keypoint.confidence
            };
        };
        
        // Utiliser les keypoints LISSÉS au lieu des bruts
        const nose = getPos(smoothedKeypoints[0]);
        const leftShoulder = getPos(smoothedKeypoints[5]);
        const rightShoulder = getPos(smoothedKeypoints[6]);
        const leftElbow = getPos(smoothedKeypoints[7]);
        const rightElbow = getPos(smoothedKeypoints[8]);
        const leftWrist = getPos(smoothedKeypoints[9]);
        const rightWrist = getPos(smoothedKeypoints[10]);
        const leftHip = getPos(smoothedKeypoints[11]);
        const rightHip = getPos(smoothedKeypoints[12]);
        const leftKnee = getPos(smoothedKeypoints[13]);
        const rightKnee = getPos(smoothedKeypoints[14]);
        const leftAnkle = getPos(smoothedKeypoints[15]);
        const rightAnkle = getPos(smoothedKeypoints[16]);
        
        p.strokeCap(p.ROUND);
        p.strokeJoin(p.ROUND);
        
        // Couleur semi-transparente pour le stick figure (50% opacité)
        const bodyColor = p.color(255, 255, 255, 128); // Blanc avec 50% opacité
        const jointColor = p.color(255, 255, 255, 140);
        const stickWidth = 6; // Plus fin
        const jointSize = 10; // Petits joints
        const headSize = 35; // Tête plus petite
        
        p.stroke(bodyColor);
        p.noFill();
        p.strokeWeight(stickWidth);
        
        // Calculer le centre du torse pour le stick
        const torsoCenter = (leftShoulder && rightShoulder && leftHip && rightHip) ? {
            shoulderX: (leftShoulder.x + rightShoulder.x) / 2,
            shoulderY: (leftShoulder.y + rightShoulder.y) / 2,
            hipX: (leftHip.x + rightHip.x) / 2,
            hipY: (leftHip.y + rightHip.y) / 2
        } : null;
        
        // Torso - juste une ligne centrale
        if (torsoCenter) {
            p.line(torsoCenter.shoulderX, torsoCenter.shoulderY, torsoCenter.hipX, torsoCenter.hipY);
        }
        
        // Arms - lignes depuis les ÉPAULES (pas le centre du torse)
        if (leftShoulder && leftElbow) p.line(leftShoulder.x, leftShoulder.y, leftElbow.x, leftElbow.y);
        if (leftElbow && leftWrist) p.line(leftElbow.x, leftElbow.y, leftWrist.x, leftWrist.y);
        if (rightShoulder && rightElbow) p.line(rightShoulder.x, rightShoulder.y, rightElbow.x, rightElbow.y);
        if (rightElbow && rightWrist) p.line(rightElbow.x, rightElbow.y, rightWrist.x, rightWrist.y);
        
        // Legs - lignes depuis les HANCHES
        if (leftHip && leftKnee) p.line(leftHip.x, leftHip.y, leftKnee.x, leftKnee.y);
        if (leftKnee && leftAnkle) p.line(leftKnee.x, leftKnee.y, leftAnkle.x, leftAnkle.y);
        if (rightHip && rightKnee) p.line(rightHip.x, rightHip.y, rightKnee.x, rightKnee.y);
        if (rightKnee && rightAnkle) p.line(rightKnee.x, rightKnee.y, rightAnkle.x, rightAnkle.y);
        
        // Shoulder line (pour connecter les bras)
        if (leftShoulder && rightShoulder) {
            p.line(leftShoulder.x, leftShoulder.y, rightShoulder.x, rightShoulder.y);
        }
        
        // Hip line (pour connecter les jambes)
        if (leftHip && rightHip) {
            p.line(leftHip.x, leftHip.y, rightHip.x, rightHip.y);
        }
        
        // Joints - petits cercles
        p.fill(jointColor);
        p.noStroke();
        if (leftWrist) p.circle(leftWrist.x, leftWrist.y, jointSize);
        if (rightWrist) p.circle(rightWrist.x, rightWrist.y, jointSize);
        if (leftAnkle) p.circle(leftAnkle.x, leftAnkle.y, jointSize);
        if (rightAnkle) p.circle(rightAnkle.x, rightAnkle.y, jointSize);
        if (leftElbow) p.circle(leftElbow.x, leftElbow.y, jointSize * 0.8);
        if (rightElbow) p.circle(rightElbow.x, rightElbow.y, jointSize * 0.8);
        if (leftKnee) p.circle(leftKnee.x, leftKnee.y, jointSize * 0.8);
        if (rightKnee) p.circle(rightKnee.x, rightKnee.y, jointSize * 0.8);
        
        // Head - cercle simple
        if (nose) {
            p.fill(jointColor);
            p.noStroke();
            p.circle(nose.x, nose.y, headSize);
        }
        
        // Neck
        if (nose && torsoCenter) {
            p.stroke(bodyColor);
            p.strokeWeight(stickWidth);
            p.line(nose.x, nose.y + headSize/2, torsoCenter.shoulderX, torsoCenter.shoulderY);
        }
        
        p.pop();
    }

    /**
     * Spawn a new wall
     */
    spawnWall(p) {
        console.log('🧱 spawnWall appelé, activeWalls.length:', this.activeWalls.length);
        
        if (this.activeWalls.length === 0) {
            let availablePoses = [];
            
            if (this.level <= 2) {
                availablePoses = POSE_TYPES.filter(pose => pose.difficulty === 1);
            } else if (this.level <= 4) {
                availablePoses = POSE_TYPES;
            } else {
                availablePoses = POSE_TYPES;
            }
            
            // Remove STANDING TALL after first 2 walls
            if (this.totalWallsSpawned >= 2) {
                availablePoses = availablePoses.filter(pose => pose.name !== 'STANDING TALL');
            }
            
            // Anti-repetition
            if (this.lastPoseName && availablePoses.length > 1) {
                availablePoses = availablePoses.filter(pose => pose.name !== this.lastPoseName);
            }
            
            const poseType = p.random(availablePoses);
            this.lastPoseName = poseType.name;
            this.totalWallsSpawned++;
            
            const wall = new PoseWall(poseType, 400, p);
            this.activeWalls.push(wall);
            
            console.log('🧱 Nouveau mur créé:', poseType.name, 'Total walls:', this.activeWalls.length);
        }
    }

    /**
     * Dessiner l'aperçu webcam
     */
    drawWebcamPreview(p, pose) {
        // Paramètres du cadre
        const camW = 240;
        const camH = 180;
        const camX = p.width - camW - 20;
        const camY = 20;

        // Fond semi-transparent et cadre (collé au bas de la webcam)
        p.fill(0, 0, 0, 180);
        p.stroke(255, 255, 0);
        p.strokeWeight(2);
        p.rect(camX - 10, camY - 10, camW + 20, camH + 20, 10);

        // Afficher la webcam en miroir
        p.push();
        p.translate(camX + camW, camY);
        p.scale(-1, 1);
        if (this.videoCapture) {
            p.image(this.videoCapture, 0, 0, camW, camH);
        }
        p.pop();

        // Overlay squelette si pose détectée (même sens que la vidéo miroir)
        if (pose && this.connections) {
            p.push();
            p.translate(camX + camW, camY);
            p.scale(-1, 1);
            const scaleX = camW / 800;
            const scaleY = camH / 600;
            p.stroke(74, 222, 128, 220);
            p.strokeWeight(3);
            p.strokeCap(p.ROUND);
            for (let connection of this.connections) {
                let pointA = pose.keypoints[connection[0]];
                let pointB = pose.keypoints[connection[1]];
                if (pointA.confidence > 0.1 && pointB.confidence > 0.1) {
                    let ax = (pointA.x * scaleX);
                    let ay = pointA.y * scaleY;
                    let bx = (pointB.x * scaleX);
                    let by = pointB.y * scaleY;
                    p.line(ax, ay, bx, by);
                }
            }
            for (let keypoint of pose.keypoints) {
                if (keypoint.confidence > 0.1) {
                    let x = (keypoint.x * scaleX);
                    let y = keypoint.y * scaleY;
                    p.fill(255);
                    p.noStroke();
                    p.ellipse(x, y, 8, 8);
                }
            }
            p.pop();
        }
    }

    /**
     * Dessiner l'indicateur de progression du mur
     */
    drawWallIndicator(p) {
        if (this.activeWalls.length > 0) {
            let nearestWall = this.activeWalls.find(w => !w.scored);
            if (!nearestWall) return;
            
            let progress = p.map(nearestWall.z, 400, 60, 0, p.width - 280);
            
            p.push();
            p.noStroke();
            
            p.fill(30, 30, 40);
            p.rect(240, p.height - 50, p.width - 280, 4, 2);
            
            const matchScore = nearestWall.matchScore || 0;
            if (matchScore >= 65) { // Seuil vert réduit à 65%
                p.fill(...COLORS.success);
            } else if (matchScore >= 40) { // Seuil orange réduit à 40%
                p.fill(255, 200, 100);
            } else {
                p.fill(100, 100, 120);
            }
            p.rect(240, p.height - 50, progress, 4, 2);
            
            p.fill(255, 255, 255, 120);
            p.textAlign(p.RIGHT);
            p.textFont('Outfit');
            p.textSize(11);
            p.text(nearestWall.poseType.name + ' ' + p.floor(matchScore) + '%', p.width - 30, p.height - 44);
            p.pop();
        }
    }

    /**
     * Dessiner le HUD
     */
    drawHUD(p) {
        p.push();
        p.textFont('Outfit');
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        // Score
        p.fill(74, 222, 128);
        p.text('Score: ' + this.score, 20, 20);
        // Level
        p.fill(251, 191, 36);
        p.text('Level: ' + this.level, 20, 45);
        // Lives
        p.fill(248, 113, 113);
        p.text('Lives: ' + this.lives, 20, 70);
        p.pop();
    }

    /**
     * Afficher un feedback
     */
    showFeedback(p, text, col) {
        this.feedbackText = text;
        this.feedbackColor = col;
        this.feedbackTimer = 50;
    }

    /**
     * Dessiner le feedback
     */
    drawFeedback(p) {
        if (this.feedbackTimer > 0) {
            p.push();
            p.textAlign(p.CENTER, p.CENTER);
            p.textFont('Outfit');
            let alpha = p.map(this.feedbackTimer, 50, 0, 255, 0);
            let size = p.map(this.feedbackTimer, 50, 0, 32, 42);
            let yOffset = p.map(this.feedbackTimer, 50, 0, 0, -15);
            // Position en haut au centre de l'écran
            const feedbackX = p.width / 2;
            const feedbackY = 100 + yOffset;
            p.textSize(size);
            p.textStyle(p.BOLD);
            p.fill(p.red(this.feedbackColor), p.green(this.feedbackColor), p.blue(this.feedbackColor), alpha);
            p.noStroke();
            p.text(this.feedbackText, feedbackX, feedbackY);
            p.textStyle(p.NORMAL);
            p.pop();
            this.feedbackTimer--;
        }
    }

    /**
     * Level up
     */
    levelUp(p) {
        this.level++;
        this.lastLevelScore = this.score;
        this.wallSpeed = p.min(4.0, 1.5 + (this.level - 1) * 0.2);
        this.wallSpawnInterval = p.max(80, 180 - (this.level - 1) * 8);
        this.showFeedback(p, 'LEVEL ' + this.level, p.color(...COLORS.warning));
    }

    /**
     * Game over
     */
    gameOver() {
        this.gamePhase = 'gameover';
        console.log(`💀 Game Over - Score: ${this.score}`);
        this.end('completed', this.score);
    }

    /**
     * Gestion des inputs
     */
    onKeyPressed(key) {
        if (key === ' ' && this.gamePhase === 'ready') {
            this.start();
        }
        if (key === 'r' && this.gamePhase === 'gameover') {
            this.start();
        }
    }

    /**
     * Nettoyage des ressources
     */
    cleanup() {
        console.log('🧹 WallShapesGame - Nettoyage');
        
        // Supprimer le HUD
        this.removeHUD();
        
        try {
            // Arrêter la détection ML5
            if (this.bodyPose) {
                this.bodyPose.detectStop();
                this.bodyPose = null;
            }
            
            // Arrêter la webcam
            if (this.videoCapture) {
                this.videoCapture.remove();
                this.videoCapture = null;
            }
            
            // Supprimer le graphics buffer
            if (this.previewGraphics) {
                this.previewGraphics.remove();
                this.previewGraphics = null;
            }
        } catch (error) {
            console.warn('⚠️ Erreur lors du nettoyage WallShapesGame:', error);
        }
        
        super.cleanup();
    }
}

/**
 * Classe PoseWall - Un mur avec une pose à reproduire
 */
class PoseWall {
    constructor(poseType, z, p) {
        this.poseType = poseType;
        this.z = z;
        this.maxZ = z;
        this.scored = false;
        this.matchScore = 0;
        this.passingThrough = false;
        this.passPhase = 0;
        this.p = p;
    }
    
    update(speed) {
        this.z -= speed;
        if (this.z <= 80 && this.z > -100) {
            this.passingThrough = true;
            this.passPhase = (80 - this.z) / 180;
        }
    }
    
    checkBodyMatch(p, pose) {
        if (!pose || !pose.keypoints) {
            this.matchScore = 0;
            return false;
        }
        
        this.matchScore = this.poseType.checkPose(pose.keypoints, p);
        return this.matchScore >= 65; // Seuil réduit de 75% à 65% pour être plus indulgent
    }
    
    draw(p, playerPose) {
        const isMatched = this.checkBodyMatch(p, playerPose);
        
        if (this.passingThrough) {
            this.drawPassingWall(p);
            return;
        }
        
        const progress = 1 - (this.z / this.maxZ);
        const scale = p.lerp(0.3, 1.0, progress);
        
        p.push();
        p.translate(p.width / 2, p.height / 2 - 20);
        
        const w = 650 * scale;
        const h = 420 * scale;
        
        // Wall shadow
        p.noStroke();
        p.fill(0, 0, 0, 80);
        p.rect(-w/2 + 8, -h/2 + 8, w, h, 10);
        
        // Main wall
        if (isMatched) {
            p.fill(74, 222, 128, 200);
        } else {
            p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2]);
        }
        p.stroke(COLORS.wallEdge[0], COLORS.wallEdge[1], COLORS.wallEdge[2]);
        p.strokeWeight(3);
        p.rect(-w/2, -h/2, w, h, 10);
        
        // Draw pose visual
        this.drawPoseVisual(p, scale, isMatched);
        
        // Pose name
        p.noStroke();
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textFont('Outfit');
        p.textSize(22 * scale);
        p.textStyle(p.BOLD);
        p.text(this.poseType.name, 0, -h/2 - 30 * scale);
        p.textStyle(p.NORMAL);
        p.textSize(14 * scale);
        p.fill(200);
        p.text(this.poseType.description, 0, -h/2 - 8 * scale);
        
        // Difficulty
        const diffStars = '★'.repeat(this.poseType.difficulty) + '☆'.repeat(3 - this.poseType.difficulty);
        p.textSize(12 * scale);
        p.fill(255, 200, 100);
        p.text(diffStars, 0, h/2 + 40 * scale);
        
        // Score indicator
        if (this.matchScore > 0) {
            p.fill(255, 255, 100);
            p.textSize(16 * scale);
            p.text(p.floor(this.matchScore) + '%', 0, h/2 + 22 * scale);
        }
        
        p.pop();
    }
    
    drawPoseVisual(p, scale, isMatched) {
        p.push();
        
        const s = 60 * scale;
        const headSize = 35 * scale;
        const limbWidth = 10 * scale;
        
        let col;
        if (isMatched) {
            col = p.color(255, 255, 255);
            p.stroke(30, 30, 30);
            p.strokeWeight(limbWidth + 4);
        } else {
            col = p.color(100, 200, 255);
            p.stroke(100, 200, 255);
            p.strokeWeight(limbWidth);
        }
        p.fill(col);
        
        const name = this.poseType.name;
        
        const drawStickman = (headY, torsoY, armStyle, legStyle) => {
            if (isMatched) {
                p.stroke(30, 30, 30);
                p.strokeWeight(limbWidth + 4);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
                
                p.stroke(255, 255, 255);
                p.strokeWeight(limbWidth);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
                
                p.stroke(30, 30, 30);
                p.strokeWeight(4);
                p.fill(255, 255, 255);
                p.circle(0, headY, headSize);
            } else {
                p.noStroke();
                p.fill(col);
                p.circle(0, headY, headSize);
                p.stroke(col);
                p.strokeWeight(limbWidth);
                p.line(0, headY + headSize/2, 0, torsoY);
                this.drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize);
            }
        };
        
        // Draw each pose
        if (name === 'HANDS UP') {
            drawStickman(-s*1.6, s*0.2, 'up', 'together');
        } else if (name === 'T-POSE') {
            drawStickman(-s*1.6, s*0.2, 't-pose', 'together');
        } else if (name === 'STAR') {
            drawStickman(-s*1.6, s*0.2, 'star', 'wide');
        } else if (name === 'ONE HAND UP') {
            drawStickman(-s*1.6, s*0.2, 'left-up', 'together');
        } else if (name === 'ARMS FORWARD') {
            drawStickman(-s*1.6, s*0.2, 'forward', 'together');
        } else if (name === 'STANDING TALL') {
            drawStickman(-s*1.6, s*0.2, 'down', 'together');
        } else if (name === 'ARMS ON HIPS') {
            drawStickman(-s*1.6, s*0.2, 'on-hips', 'together');
        } else if (name === 'WIDE STANCE') {
            drawStickman(-s*1.6, s*0.2, 'down', 'wide');
        } else if (name === 'LEFT ARM UP') {
            drawStickman(-s*1.6, s*0.2, 'left-up', 'together');
        } else if (name === 'RIGHT ARM UP') {
            drawStickman(-s*1.6, s*0.2, 'right-up', 'together');
        } else if (name === 'CROSS ARMS') {
            drawStickman(-s*1.6, s*0.2, 'crossed', 'together');
        } else if (name === 'SUPERHERO') {
            drawStickman(-s*1.6, s*0.2, 'hero', 'together');
        }
        
        p.pop();
    }
    
    drawArmsAndLegs(p, headY, torsoY, armStyle, legStyle, s, headSize) {
        // Draw arms
        if (armStyle === 'up') {
            p.line(0, headY + headSize/2 + s*0.2, -s*0.3, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.2, s*0.3, headY - s*0.5);
        } else if (armStyle === 't-pose') {
            p.line(-s*1.3, torsoY - s*0.8, s*1.3, torsoY - s*0.8);
        } else if (armStyle === 'star') {
            p.line(0, headY + headSize/2 + s*0.3, -s*0.9, headY - s*0.3);
            p.line(0, headY + headSize/2 + s*0.3, s*0.9, headY - s*0.3);
        } else if (armStyle === 'left-up') {
            p.line(0, headY + headSize/2 + s*0.2, -s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, s*0.6, headY + s*0.2);
        } else if (armStyle === 'right-up') {
            p.line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, -s*0.6, headY + s*0.2);
        } else if (armStyle === 'down') {
            p.line(0, headY + headSize/2 + s*0.4, -s*0.7, torsoY);
            p.line(0, headY + headSize/2 + s*0.4, s*0.7, torsoY);
        } else if (armStyle === 'crossed') {
            p.line(0, headY + headSize/2 + s*0.3, s*0.4, torsoY - s*0.3);
            p.line(0, headY + headSize/2 + s*0.3, -s*0.4, torsoY - s*0.3);
        } else if (armStyle === 'hero') {
            p.line(0, headY + headSize/2 + s*0.2, s*0.4, headY - s*0.5);
            p.line(0, headY + headSize/2 + s*0.4, -s*0.5, torsoY - s*0.2);
        } else if (armStyle === 'forward') {
            p.line(0, headY + headSize/2 + s*0.3, -s*0.6, headY + s*0.6);
            p.line(0, headY + headSize/2 + s*0.3, s*0.6, headY + s*0.6);
        } else if (armStyle === 'on-hips') {
            p.line(0, headY + headSize/2 + s*0.4, -s*0.6, torsoY - s*0.2);
            p.line(0, headY + headSize/2 + s*0.4, s*0.6, torsoY - s*0.2);
        }
        
        // Draw legs
        if (legStyle === 'together') {
            p.line(0, torsoY, -s*0.15, torsoY + s*1.1);
            p.line(0, torsoY, s*0.15, torsoY + s*1.1);
        } else if (legStyle === 'wide') {
            p.line(0, torsoY, -s*0.9, torsoY + s*1.1);
            p.line(0, torsoY, s*0.9, torsoY + s*1.1);
        }
    }
    
    drawPassingWall(p) {
        p.push();
        p.translate(p.width / 2, p.height / 2 - 20);
        
        const w = 650;
        const h = 420;
        const splitAmount = this.passPhase * 400;
        const alpha = p.map(this.passPhase, 0, 1, 255, 0);
        
        p.push();
        p.translate(-splitAmount, 0);
        p.noStroke();
        p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        p.rect(-w/2, -h/2, w/2 - 30, h, 10);
        p.pop();
        
        p.push();
        p.translate(splitAmount, 0);
        p.noStroke();
        p.fill(COLORS.wall[0], COLORS.wall[1], COLORS.wall[2], alpha);
        p.rect(30, -h/2, w/2 - 30, h, 10);
        p.pop();
        
        p.pop();
    }
    
    isAtPlayer() {
        return this.z <= 80 && this.z > 60 && !this.scored;
    }
    
    hasPassed() {
        return this.z <= -100;
    }
}

